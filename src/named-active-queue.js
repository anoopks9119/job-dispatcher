class NamedActiveQueue {
  constructor() {
    this._queue = {};
    this._active = {};
    this._limit = {};
    this._count = {};
  }

  setActiveLimits(limit) {
    const message = "Unsupported value for limit parameter";
    if (typeof limit !== "object") {
      throw new TypeError(message);
    }
    const keys = Object.keys(limit);
    keys.forEach((key) => {
      //Check if value is integer
      if (!Number.isInteger(limit[key])) {
        throw new TypeError(`${message}, key : ${key}`);
      }
    });
    //No errors
    keys.forEach((key) => {
      this._limit[key] = limit[key];
      this._count[key] = 0;
      this._active[key] = 0;
    });
  }

  pushItems(items) {
    if (!(items instanceof Array)) {
      throw new TypeError("Array of items should be pushed to queue");
    }

    items.forEach((item) => {
      const { name, data } = item;
      if (!(name in this._queue)) {
        this._queue[name] = [];
      }
      this._queue[name].push(data);
    });
  }

  getNextItems() {
    const nextItems = [];
    for (let name in this._queue) {
      const limit = this._limit[name];
      if (!limit) {
        throw new Error(`"Limit not set for name : ${name}"`);
      }
      while (this._active[name] < limit && this._queue[name].length > 0) {
        const item = this._queue[name].shift();
        this._active[name]++;
        nextItems.push({ name, data: item });
      }
    }

    return nextItems;
  }

  setItemComplete(name) {
    if (!(name in this._active)) {
      throw new Error(`Name ${name} not yet configured in queue`);
    }
    this._active[name]--;
  }

  getActiveCount() {
    let count = 0;
    for (let name in this._active) {
      count += this._active[name];
    }
    return count;
  }

  getPendingItemsCount() {
    let count = 0;
    for (let name in this._active) {
      count += this._active[name] + this._queue[name].length;
    }
    return count;
  }

  flush() {
    for (let name in this._queue) {
      this._queue[name] = [];
    }
  }
}

module.exports = NamedActiveQueue;
