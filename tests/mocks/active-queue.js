function getActiveQueueMock() {

    return {
        pushItems : jest.fn(),
        setActiveLimits : jest.fn(),
        getNextItems : jest.fn(() => []).mockImplementationOnce(() => {
            return [{
                name : "job1",
                data : "Test1"
            }, {
                name : "job1",
                data : "Test2"
            }, {
                name : "job1",
                data : "Test3"
            }]
        }).mockImplementationOnce(() => {
            
            return [{
                name : "job1",
                data : "Test4"
            }, {
                name : "job1",
                data : "Test5"
            }];
        
        }),
        setItemComplete : jest.fn(),
        getPendingItemsCount : jest.fn(() => 0).mockImplementationOnce(() => 2).mockImplementationOnce(() => 1)
    }
}

export default getActiveQueueMock;