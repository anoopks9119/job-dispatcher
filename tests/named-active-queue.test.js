const NamedActiveQueue = require("../src/named-active-queue");

describe("Named active tests", () => {
  test("setting unsupported string for limit object", () => {
    expect(() => {
      const queue = new NamedActiveQueue();
      queue.setActiveLimits("String");
    }).toThrow("Unsupported value for limit parameter");
  });

  test("setting unsupported format for limit object", () => {
    expect(() => {
      const queue = new NamedActiveQueue();
      queue.setActiveLimits({
        job1: 3,
        job2: "wrong",
      });
    }).toThrow("Unsupported value for limit parameter, key : job2");
  });

  test("pushing non-array for adding items throw error", () => {
    expect(() => {
      const queue = new NamedActiveQueue();
      queue.setActiveLimits({
        job1: 5,
      });
      const items = {
        name: "unsupported",
      };
      queue.pushItems(items);
    }).toThrow("Array of items should be pushed to queue");
  });

  test("getting all pending items", () => {
    const items = [
      {
        name: "job1",
        data: "data1",
      },
      {
        name: "job2",
        data: "data2",
      },
    ];

    const queue = new NamedActiveQueue();
    queue.setActiveLimits({
      job1: 3,
      job2: 4,
    });
    queue.pushItems(items);
    const nextItems = queue.getNextItems();
    expect(nextItems).toEqual(items);
  });

  test("getting only items within limit", () => {
    const items = [];
    for (let i = 0; i < 5; i++) {
      items.push({
        name: `job1`,
        data: `data${i + 1}`,
      });
    }

    for (let i = 0; i < 5; i++) {
      items.push({
        name: `job2`,
        data: `data${i + 1}`,
      });
    }

    const queue = new NamedActiveQueue();
    queue.setActiveLimits({
      job1: 2,
      job2: 3,
    });

    queue.pushItems(items);
    const nexItems = queue.getNextItems();

    //checks
    const expected = [];
    for (let i = 0; i < 2; i++) {
      expected.push({
        name: `job1`,
        data: `data${i + 1}`,
      });
    }

    for (let i = 0; i < 3; i++) {
      expected.push({
        name: `job2`,
        data: `data${i + 1}`,
      });
    }

    expect(nexItems.length).toEqual(5);
    expect(nexItems).toEqual(expected);
  });

  test("getting count of pending items", () => {
    const items = [];
    for (let i = 0; i < 5; i++) {
      items.push({
        name: `job1`,
        data: `data${i + 1}`,
      });
    }

    for (let i = 0; i < 5; i++) {
      items.push({
        name: `job2`,
        data: `data${i + 1}`,
      });
    }

    const queue = new NamedActiveQueue();
    queue.setActiveLimits({
      job1: 2,
      job2: 3,
    });
    queue.pushItems(items);
    const nextItems = queue.getNextItems();
    queue.setItemComplete("job1");
    queue.setItemComplete("job2");
    const count = queue.getPendingItemsCount();
    expect(count).toEqual(8);
  });

  test("getting count of active items", () => {
    const items = [];
    for (let i = 0; i < 5; i++) {
      items.push({
        name: `job1`,
        data: `data${i + 1}`,
      });
    }

    for (let i = 0; i < 5; i++) {
      items.push({
        name: `job2`,
        data: `data${i + 1}`,
      });
    }

    const queue = new NamedActiveQueue();
    queue.setActiveLimits({
      job1: 2,
      job2: 3,
    });
    queue.pushItems(items);
    const nextItems = queue.getNextItems();
    const count = queue.getActiveCount();
    expect(count).toEqual(5);
  });
});
