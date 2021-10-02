const EventEmitter = require("events");

/**
 * @class Dispatcher
 */
class Dispatcher extends EventEmitter {
  constructor(queue) {
    super({ captureRejections: true });
    if (!queue) {
      throw new Error("Queue object is mandatory");
    }

    this._queue = queue;
    this._jobManagers = {};
    this._timerId = null;
    this._aborted = false;
    this._closed = false; //This flag means no jobs or async loop should be started
  }

  /**
   *
   * @param {*} managerDefinition
   */
  configure = ({ managerDefinitions, limit }) => {
    if (typeof managerDefinitions !== "object") {
      throw new Error(
        "Manager definition should be an object. Check documentation"
      );
    }

    for (let name in managerDefinitions) {
      const { jobFunction, limit } = managerDefinitions[name];
      this._jobManagers[name] = {
        jobFunction,
      };
    }

    if (limit) {
      this._queue.setActiveLimits(limit);
    }
  };

  _startDispatching = () => {
    if (this._closed) return; //Do not start job dispatching or async loop
    const selfCall = () => {
      this._startDispatching();
    };

    const jobs = this._queue.getNextItems(); //Get the next set of jobs from specific class
    jobs.forEach(async (job) => {
      const { name, data } = job;
      try {
        const { jobFunction } = this._jobManagers[name];
        const jobResponse = await jobFunction(data, this);
        if (jobResponse) {
          this.emit("jobcompleted", name, jobResponse, this);
        }
      } catch (err) {
        this.emit("joberror", err, name, this);
      } finally {
        this._queue.setItemComplete(name);
        if (this._queue.getPendingItemsCount() === 0) {
          this.emit("emptyqueue", this);
        }
      }
    });
    if (!this._closed) this._timerId = setTimeout(selfCall, 500);
  };

  /**
   *
   * @param {*} resolve
   */
  _checkActive(resolve) {
    const selfCall = () => {
      this._checkActive(resolve);
    };

    if (this._queue.getActiveCount() > 0) {
      this._timerId = setTimeout(selfCall, 500);
    } else resolve();
  }

  /**
   * Start the dispatcher, i.e. start async loop on the jobs queue
   * Also raise a start event
   */
  start() {
    this._closed = false;
    this._startDispatching();

    this.emit("dispatchstarted");
  }

  async end() {
    clearTimeout(this._timerId);
    this._closed = true;
    this._queue.flush();
    await new Promise((resolve, reject) => {
      this._checkActive(resolve);
    });
  }

  addJobs(jobsArray) {
    if (this._aborted) return;

    let index = 0;
    for (let job of jobsArray) {
      if (!("name" in job)) {
        throw new Error(`name attribute missing in job at index ${index}`);
      }

      if (!("data" in job)) {
        throw new Error(`data attribute missing in job at index ${index}`);
      }
      index++;
    }

    this._queue.pushItems(jobsArray);
  }
}

module.exports = Dispatcher;
