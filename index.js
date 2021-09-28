var Dispatcher = (function () {

    /**
     * Dipatcher class
     * @constructor
     */
    function Dispatcher(queue, limit) {

        if (queue) {
            this._queue = queue;
        } else this._queue = [];

        if (limit) {
            this._limit = limit;
        } else this._limit = Number.MAX_VALUE;

        this._jobManagers = {};
        this._active = 0;
        this._timerId = null;
        this._signalHandler = null;
        this._dependencies = {};
        this._aborted = false;
        this._closed = false;

    }

    /**
     * Add job managers
     * @param {string} jobName
     * @param {Manager} jobManager
     * @param {Array} dependencies
     */
    Dispatcher.prototype.addManager = function (jobManager, dependencies) {
        var jobName = jobManager.getJobName();
        this._jobManagers[jobName] = jobManager;
        this._dependencies[jobName] = dependencies;
        jobManager.subscribe(_managerHandler.call(this));
    }

    /**
     * Handler function for manager events
     * @method
     * @private
     * @returns {function}
     */
    function _managerHandler() {
        var self = this;
        /**
         * Wrapper function for event handler to handle changing 'this'
         * @param {Object} event
         */
        var wrapper = function (event) {

            switch (event.type) {
                //Handle job done inside manager with close/error
                case 'done':
                    self._active--;
                    //Set event for signal with type, arg and jobName
                    var signalEvent;
                    //Invoke signal handler if done() with argument
                    if (event.arg) {
                        signalEvent = {
                            type: 'done',
                            arg: event.arg,
                            jobName: event.jobName
                        }
                        try {
                            self._signalHandler(signalEvent, self._jobManagers, _close.call(self, true));
                        } catch (e) {
                        }
                    }
                    /*
                     * Invoke signal handler if done() with closed, if job managers have no
                     * pending jobs
                     * Also check if the dispatcher is not aborted
                     */

                    if (event.closed && !self._aborted) {

                        var closed = true;
                        for (var jobName in self._jobManagers) {
                            var jobManager = self._jobManagers[jobName];
                            if (jobManager.isPending()) {
                                closed = false;
                                break;
                            }
                        }

                        if (!closed) {
                            return;
                        }

                        signalEvent = {
                            type: 'closed',
                            arg: event.arg,
                            jobName: event.jobName
                        }
                        try {
                            self._signalHandler(signalEvent, self._jobManagers, _close.call(self));
                        } catch (e) {

                        }
                    }
                    break;
                //Handle addition of new jobs in manager
                case 'add':
                    //Do not add jobs if already aborted
                    if (self._aborted == true) {
                        return;
                    }
                    if (event.jobs) {
                        for (var i = 0; i < event.jobs.length; i++) {
                            self._queue.push(event.jobs[i]);
                        }
                    }
                    break;
                default:
            }
        }
        return wrapper;
    }

    /**
     * Start dispatcher
     */
    function _startDispatching() {

        var self = this;
        var selfCall = function () {
            _startDispatching.call(self);
        }
        while (this._active < this._limit && this._queue.length > 0) {

            this._active++;
            var job = this._queue.shift();
            if ('jobName' in job) {
                var jobManager = this._jobManagers[job.jobName];
                var data = job.jobData;
                var args = this._dependencies[job.jobName].slice();
                args.splice(0, 0, data);
                jobManager.execute.apply(jobManager, args);
            }
        }
        if(!this._closed) this._timerId = setTimeout(selfCall, 500);
    }

    /**
     * Set handler function for events in dispatcher
     * @param {function} handler
     */
    Dispatcher.prototype.start = function (handler) {

        this._signalHandler = handler;        
        _startDispatching.call(this);
        //Trigger a start event for signal handler
        var signalEvent = {
            type: 'start'
        }
        this._signalHandler(signalEvent, this._jobManagers, _close.call(this));
       
    }

    /**
     * Asynchronous check for active jobs
     */
    function _checkActive() {

        var self = this;
        var selfCall = function () {
            _checkActive.call(self);
        }

        if (this._active > 0) {
            this._timerId = setTimeout(selfCall, 500);
        } else {
            var signalEvent = {
                type: 'abort'
            };
            try {
                this._signalHandler(signalEvent, this._jobManagers);
            } catch (e) {
            }
        }

    }

    /**
     * Abort dispatcher
     *
     */
    Dispatcher.prototype.abort = function () {

        //Signal handler is the indicator that dispatcher has been started
        if (!this._signalHandler) {
            return;
        }
        //If signal handler set, then timerId will have been set        
        clearTimeout(this._timerId);
        this._aborted = true;
        _checkActive.call(this);

    }

    /**
     * End the dispatcher, wrapper since 'this' can change
     * @method
     * @private
     * @returns {function}
     */
    function _close(abort) {

        var self = this;
        var endFunction = !abort ?
        function(){
            clearTimeout(self._timerId);
            self._closed = true;
        } :
        function(){
            self.abort();
        }
        return endFunction;
    }

    return Dispatcher;

})();

var Manager = (function () {

    /**Job manager class
     * @constructor
     * @param {string} jobName
     * @param {function} jobFunction
     */
    function Manager(jobName, jobFunction, state) {

        this._jobName = jobName;
        this._jobFunction = jobFunction;
        this._observers = [];
        this._state = {};
        this._count = 0;
        this._completed = 0;
        if (state) {
            for (var key in state) {
                this._state[key] = state[key];
            }
        }

    }

    /**
     * Event emitter function, calls all observer functions
     * @param {Object} event
     */
    function _emit(event) {
        for (var i = 0; i < this._observers.length; i++) {
            this._observers[i](event);
        }
    }

    /**
     * Return job name
     * @returns {string}
     */
    Manager.prototype.getJobName = function () {
        return this._jobName;
    }

    /**
     * Subscribe funtion, attach observers to Manager object
     * @param {function} observer
     */
    Manager.prototype.subscribe = function (observer) {
        this._observers.push(observer)
    }

    /**
     * Set state to be shared amoung job executions
     * @param {Object} state
     */
    Manager.prototype.setState = function (state) {
        for (var key in state) {
            if (key in this._state) {
                this._state[key] = state[key];
            }
            else {
                this[key] = state[key];
            }
        }
    }
    /**
      * Executes the job function with the data provided
      * Injects the next function
      * @param {Object} data
      */
    Manager.prototype.execute = function (data) {

        var self = this;
        var doneWrapper = function (arg) {
            self.done(arg);
        }
        var args = [data, doneWrapper, this._state];
        for (var i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        this._jobFunction.apply(null, args);

    }

    /**
     * Add a new job to the manager
     * @param {Array} jobs
     */
    Manager.prototype.addJob = function (jobs) {

        if (jobs.length > 0) {
            var modJobs = [];
            for (var i = 0; i < jobs.length; i++) {
                this._count++;
                modJobs.push({
                    jobName: this._jobName,
                    jobData: jobs[i]
                });
            }
            var event = {
                type: 'add',
                jobs: modJobs
            };
            _emit.call(this, event);
        }
    }

    /**
     * Check if manager has pending jobs
     * @returns {Boolean}
     */
    Manager.prototype.isPending = function () {
        if (this._count - this._completed == 0) {
            return false;
        }
        return true;
    }

    /**
     * Signal manager that job is finished
     * @param {Error} arg
     */
    Manager.prototype.done = function (arg) {
        this._completed++;
        var event = {
            type: 'done',
            jobName: this._jobName,
            closed: (this._count - this._completed == 0) ? true : false,
            arg: arg
        }
        _emit.call(this, event);
    }

    return Manager;

})();