class IndexGroup {

    constructor(name, indexConfigurationPaths) {
        this.indexConfigurationPaths = indexConfigurationPaths;
        this.name = name;
    }

    getName() {
        return this.name;
    }

    getIndexConfigurationPaths() {
        return this.indexConfigurationPaths;
    }
}

module.exports = IndexGroup;