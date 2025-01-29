
const IndexingTask = require('./indexing-task');

/**
 * Takes care of reindexing resources with index groups.
 * An index group is a range of index configuration files that need to be run for a resource
 */
class IndexManager {

    constructor(groups, tickRate) {

        this.tasks = [];
        this.groupMap = {};
        this.tickRate = tickRate;
        this.isRunningTask = false;
        this.groups = groups;
       
        for(var group of groups) {
            this.groupMap[group.getName()] = group;
        }
    }

    async start() {
        await this.buildIndex();
        this.iid = setInterval(this.tick.bind(this), this.tickRate);
    }

    async buildIndex() {

        for(var group of this.groups) {
            let indexingTask = new IndexingTask(null, group);
            await indexingTask.run();
        }
    }

    async runNextTask() {
        this.isRunningTask = true;
        var task = this.tasks.shift();
        await task.run();
        this.isRunningTask = false;
    }

    tick() {
       
        if(this.isRunningTask) {
            return;
        }

        if(this.tasks.length == 0) {
            return;
        }

        this.runNextTask();
    }

    updateResource(resourceURI, indexGroupName) {

        if(resourceURI == null) {
            return;
        }

        if(indexGroupName != null && this.groupMap[indexGroupName] == undefined) {
            return;
        }

        let indexGroup = null;

        if(indexGroupName != null) {
            indexGroup = this.groupMap[indexGroupName];
        }

        let indexingTask = new IndexingTask(resourceURI, indexGroup);

        // Leave, if a task like this already exists in the list
        for(var existingTask of this.tasks) {
            if(existingTask.equals(indexingTask)) {
                return;
            }
        }

        this.tasks.push(indexingTask);
    }
}

module.exports = IndexManager;