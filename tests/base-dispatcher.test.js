"use strict";

const Dispatcher = require("../src/base-dispatcher");
import ActiveQueue from "../src/active-queue";
import getActiveQueueMock from "./mocks/active-queue";
jest.mock("../src/active-queue");

describe("Dispatcher tests with normal queue", () => {
  beforeEach(() => {
    ActiveQueue.mockClear();
    //mockPushItems.mockClear();
  });

  test("creating dispatcher without queuer", () => {
    expect(() => {
      const dispatcher = new Dispatcher();
    }).toThrow("Queue object is mandatory");
  });

  test("configuring manager definition", () => {
    const dispatcher = new Dispatcher(new ActiveQueue());
    const config = {
      managerDefinitions: {
        job1: {
          jobFunction: "test",
        },
      },
      limit: 2,
    };
    expect(() => {
      dispatcher.configure(config);
    }).toThrow("Manager definition should be an object. Check documentation");
  });

  test("adding jobs validation - without job name", () => {
    const wrongJobs = [
      {
        data: "Tests",
      },
      { data: "Tests" },
    ];

    const dispatcher = new Dispatcher(new ActiveQueue());

    expect(() => {
      dispatcher.addJobs(wrongJobs);
    }).toThrow("name attribute missing in job at index 0");
  });

  test("adding jobs validation - without job data", () => {
    const wrongJobs = [
      {
        name: "job1",
        data: "Tests",
      },
      { name: "job2" },
    ];

    const dispatcher = new Dispatcher(new ActiveQueue());

    expect(() => {
      dispatcher.addJobs(wrongJobs);
    }).toThrow("data attribute missing in job at index 1");
  });

  test("adding jobs - successful", () => {
    const jobs = [
      {
        name: "job1",
        data: "Test1",
      },
      {
        name: "job2",
        data: "Test2",
      },
    ];

    const dispatcher = new Dispatcher(new ActiveQueue());

    dispatcher.addJobs(jobs);

    //Checks
    const mockPushItems = ActiveQueue.mock.instances[0].pushItems;
    expect(mockPushItems.mock.calls[0][0]).toEqual(jobs);
  });
});

describe("Dispatcher asynchronous tests", () => {
  beforeEach(() => {
    ActiveQueue.mockClear();
    ActiveQueue.mockImplementation(() => {
      return getActiveQueueMock();
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("dispatcher initial calling of job function", () => {
    jest.useFakeTimers();

    const mockJobFunction = jest.fn();
    const dispatcher = new Dispatcher(new ActiveQueue());
    dispatcher.configure({
      managerDefinitions: {
        job1: {
          jobFunction: mockJobFunction,
        },
      },
    });
    dispatcher.start();
    expect(mockJobFunction).toHaveBeenCalledTimes(3);
  });

  test("dispatcher test loop call of settimeout", () => {
    jest.useFakeTimers();
    const mockJobFunction = jest.fn();
    const dispatcher = new Dispatcher(new ActiveQueue());
    dispatcher.configure({
      managerDefinitions: {
        job1: {
          jobFunction: mockJobFunction,
        },
      },
    });
    dispatcher.start();

    //Checks
    jest.runOnlyPendingTimers();
    expect(mockJobFunction).toHaveBeenCalledTimes(5);
    jest.runOnlyPendingTimers();
    expect(mockJobFunction).toHaveBeenCalledTimes(5);
  });

  test("dispatcher test dispatching of right job functions", () => {
    jest.useFakeTimers();
    ActiveQueue.mockClear();
    ActiveQueue.mockImplementation(() => {
      return {
        ...getActiveQueueMock(),
        getNextItems: jest
          .fn(() => [])
          .mockImplementationOnce(() => [
            {
              name: "job1",
              data: "Test1",
            },
            {
              name: "job2",
              data: "Test2",
            },
            {
              name: "job2",
              data: "Test3",
            },
          ])
          .mockImplementationOnce(() => [
            {
              name: "job2",
              data: "Test4",
            },
            {
              name: "job1",
              data: "Test5",
            },
          ]),
      };
    });

    const mockJobFunction1 = jest.fn();
    const mockJobFunction2 = jest.fn();
    const dispatcher = new Dispatcher(new ActiveQueue());
    dispatcher.configure({
      managerDefinitions: {
        job1: {
          jobFunction: mockJobFunction1,
        },
        job2: {
          jobFunction: mockJobFunction2,
        },
      },
    });
    dispatcher.start();

    //Checks
    expect(mockJobFunction1).toHaveBeenCalledTimes(1);
    expect(mockJobFunction2).toHaveBeenCalledTimes(2);

    jest.runOnlyPendingTimers();
    expect(mockJobFunction1).toHaveBeenCalledTimes(2);
    expect(mockJobFunction2).toHaveBeenCalledTimes(3);

    jest.runOnlyPendingTimers();
    expect(mockJobFunction1).toHaveBeenCalledTimes(2);
    expect(mockJobFunction2).toHaveBeenCalledTimes(3);
  });

  test("dispatcher empty queue event handler", async () => {
    jest.useFakeTimers();
    const mockCallback = jest.fn();

    const mockJobFunction1 = jest.fn(() => Promise.resolve(1));
    const mockJobFunction2 = jest.fn(() => Promise.resolve(1));
    const dispatcher = new Dispatcher(new ActiveQueue());
    dispatcher.configure({
      managerDefinitions: {
        job1: {
          jobFunction: mockJobFunction1,
        },
        job2: {
          jobFunction: mockJobFunction2,
        },
      },
    });

    dispatcher.on("emptyqueue", mockCallback);
    dispatcher.start();

    //checks

    expect(mockCallback).not.toBeCalled();
    await new Promise((resolve) => {
      resolve();
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  test("dispatcher job completed event test", async () => {
    jest.useFakeTimers();
    ActiveQueue.mockClear();
    ActiveQueue.mockImplementation(() => {
      return {
        ...getActiveQueueMock(),
        getNextItems: jest
          .fn(() => [])
          .mockImplementationOnce(() => [
            {
              name: "job1",
              data: "Test1",
            },
            {
              name: "job1",
              data: "Test2",
            },
            {
              name: "job2",
              data: "Test3",
            },
          ]),
      };
    });

    const mockCallback = jest.fn();

    const mockJobFunction1 = jest.fn(() => Promise.resolve(1));
    const mockJobFunction2 = jest.fn(() => Promise.resolve());
    const dispatcher = new Dispatcher(new ActiveQueue());
    dispatcher.configure({
      managerDefinitions: {
        job1: {
          jobFunction: mockJobFunction1,
        },
        job2: {
          jobFunction: mockJobFunction2,
        },
      },
    });

    dispatcher.on("jobcompleted", mockCallback);
    dispatcher.start();

    //checks

    expect(mockCallback).not.toBeCalled();
    await Promise.resolve();

    expect(mockCallback).toHaveBeenCalledTimes(2);
  });
});
