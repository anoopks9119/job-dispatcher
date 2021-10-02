const ActiveQueue = require("../src/active-queue");

describe("active queue tests", () => {
  test("setting limit throw error for string value", () => {
    expect(() => {
      const queue = new ActiveQueue();
      queue.setActiveLimits("String");
    }).toThrow("Unsupported value for limit parameter");
  });

  test("setting limit throw error for non-integer value", () => {
    expect(() => {
      const queue = new ActiveQueue();
      queue.setActiveLimits(0.5);
    }).toThrow("Unsupported value for limit parameter");
  });

  test("pushing non-array for adding items throw error", () => {
    expect(() => {
      const queue = new ActiveQueue();
      queue.setActiveLimits(5);
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

    const queue = new ActiveQueue();
    queue.setActiveLimits(5);
    queue.pushItems(items);
    const nextItems = queue.getNextItems();
    expect(nextItems).toEqual(items);
  });

  test("getting only items within limit", () => {
    const items = [];
    for (let i = 0; i < 5; i++) {
      items.push({
        name: `job${i + 1}`,
        data: `data${i + 1}`,
      });
    }

    const queue = new ActiveQueue();
    queue.setActiveLimits(2);
    queue.pushItems(items);
    const nexItems = queue.getNextItems();
    expect(nexItems).toEqual(items.slice(0, 2));
  });

  test("getting count of pending items", () => {
    const items = [];
    for (let i = 0; i < 5; i++) {
      items.push({
        name: `job${i + 1}`,
        data: `data${i + 1}`,
      });
    }

    const queue = new ActiveQueue();
    queue.setActiveLimits(2);
    queue.pushItems(items);
    const nextItems = queue.getNextItems();
    queue.setItemComplete();
    const count = queue.getPendingItemsCount();
    expect(count).toEqual(4);
  });

  test("getting count of active items", () => {
    const items = [];
    for (let i = 0; i < 5; i++) {
      items.push({
        name: `job${i + 1}`,
        data: `data${i + 1}`,
      });
    }

    const queue = new ActiveQueue();
    queue.setActiveLimits(2);
    queue.pushItems(items);
    const nextItems = queue.getNextItems();
    const count = queue.getActiveCount();
    expect(count).toEqual(2);
  });

  test("setting item complete", () => {
    const items = [];
    for (let i = 0; i < 5; i++) {
      items.push({
        name: `job${i + 1}`,
        data: `data${i + 1}`,
      });
    }

    const queue = new ActiveQueue();
    queue.setActiveLimits(2);
    queue.pushItems(items);
    const nextItems = queue.getNextItems();
    queue.setItemComplete();

    const count = queue.getActiveCount();
    expect(count).toEqual(1);
  });

  test("setting item complete and getting next active items", () => {
    const items = [];
    for (let i = 0; i < 5; i++) {
      items.push({
        name: `job${i + 1}`,
        data: `data${i + 1}`,
      });
    }

    const queue = new ActiveQueue();
    queue.setActiveLimits(2);
    queue.pushItems(items);
    queue.setItemComplete();

    queue.getNextItems();
    const count = queue.getActiveCount();
    expect(count).toEqual(2);
  });
});
