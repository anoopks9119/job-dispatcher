const ActiveQueue = require("../src/active-queue");
const Dispatcher = require("../src/base-dispatcher");


function job1(data, dispatcher) {
    return Promise.resolve();
}


(async function() {


const dispatcher = new Dispatcher(new ActiveQueue());

dispatcher.configure({
    limit : 3,
    managerDefinitions : {
        "job1" : {
            jobFunction : job1
        }
    }
});

dispatcher.start();

dispatcher.addJobs([
    {
        name: "job1",
        data : {
            "firstName" : "anoop"
        }
    },
    {
        name: "job1",
        data : {
            "firstName" : "anoop"
        }
    }
]);

dispatcher.on('emptyqueue', async () => {

   await dispatcher.end();
   console.log("Dispatcher ended");

});

//await dispatcher.end();

console.log('Test');

setTimeout(() => {
    console.log('Test2');
}, 0); 



})();