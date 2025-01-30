class DatabusResource {
    static DATABUS_COLLECTION_GROUP = "collections";

    constructor(uriString) {
        if (!uriString) {
            throw new Error("A valid URI string is required");
        }

        this.parseUri(new URL(uriString));
    }

    parseUri(url) {
        this.baseURI = `${url.protocol}//${url.host}`;
        const segments = url.pathname.split("/").filter(Boolean);

        this.account = segments[0] || null;
        this.group = segments[1] || null;
        this.artifact = segments[2] || null;
        this.version = segments[3] || null;
    }

    getAccount() {
        return this.account;
    }

    getGroup() {
        return this.group;
    }

    getArtifact() {
        return this.artifact;
    }

    getVersion() {
        return this.version;
    }

    getAccountURI() {
        return this.account ? `${this.baseURI}/${this.account}` : null;
    }

    getGroupURI() {
        return this.group ? `${this.baseURI}/${this.account}/${this.group}` : null;
    }

    getArtifactURI() {
        return this.artifact ? `${this.baseURI}/${this.account}/${this.group}/${this.artifact}` : null;
    }

    getCollectionURI() {
        return this.artifact ? `${this.baseURI}/${this.account}/${DatabusResource.DATABUS_COLLECTION_GROUP}/${this.artifact}` : null;
    }

    getVersionURI() {
        return this.version ? `${this.baseURI}/${this.account}/${this.group}/${this.artifact}/${this.version}` : null;
    }

    getBaseURI() {
        return this.baseURI;
    }

    toString() {
        return `DatabusResource { account: '${this.account}', group: '${this.group}', artifact: '${this.artifact}', version: '${this.version}' }`;
    }

    equals(other) {
        if (!(other instanceof DatabusResource)) return false;
        return (
            this.account === other.account &&
            this.group === other.group &&
            this.artifact === other.artifact &&
            this.version === other.version &&
            this.baseURI === other.baseURI
        );
    }

    hashCode() {
        return JSON.stringify([this.account, this.group, this.artifact, this.version, this.baseURI]).hashCode();
    }

    isVersion() {
        return this.version !== null;
    }

    isArtifact() {
        return this.artifact !== null && this.version === null && this.group !== DatabusResource.DATABUS_COLLECTION_GROUP;
    }

    isCollection() {
        return this.artifact !== null && this.version === null && this.group === DatabusResource.DATABUS_COLLECTION_GROUP;
    }

    isGroup() {
        return this.group !== null && this.artifact === null;
    }

    isAccount() {
        return this.account !== null && this.group === null;
    }
}

module.exports = DatabusResource;