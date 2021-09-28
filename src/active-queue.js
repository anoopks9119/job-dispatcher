class ActiveQueue {

    constructor(){
        this._queue = [];
        this._active = 0;
        this._limit = 0;
        this._count = 0;
    }

    setActiveLimits(limit) {
        this._limit = limit;
    }

    pushItems(itemsArray){

        itemsArray.forEach(item => {
            this._queue.push(item); 
            this._count++;
        });          
         
    }

    getNextItems() {

        const nextItems = [];
        while(this._active < this._limit && this._queue.length > 0){
            const item = this._queue.shift();
            this._active++;
            nextItems.push(item);
        }

        return nextItems;

    }

    setItemComplete(name){
        this._active--;
    }

    getActiveCount(){
        return this._active;
    }

    getPendingItemsCount(){
        return this._active + this._queue.length;
    }

    flush(){
        this._queue = [];
    }

}

module.exports = ActiveQueue;