
class DatabusResource {

    static DATABUS_COLLECTION_GROUP = "collections";

    constructor(uri) {

        let url = new URL(uri);
        this.baseURI = url.origin;
        let segments = url.pathname.split("/");

        // Assign fields based on URI segments
        // Assuming URI follows the structure: /<account>/<group>/<artifact>/<version>
        if (segments.length > 1) {
            this.account = segments[1];
        }
        if (segments.length > 2) {
            this.group = segments[2];
        }
        if (segments.length > 3) {
            this.artifact = segments[3];
        }
        if (segments.length > 4) {
            this.version = segments[4];
        }
    }

    // Getters for the fields
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

    // Getters for URIs
    getAccountURI() {
        return this.account != null ? `${this.baseURI}/${this.account}` : null;
    }

    getGroupURI() {
        return this.group != null 
            ? `${this.baseURI}/${this.account}/${this.group}` 
            : null;
    }

    getArtifactURI() {
        return this.artifact != null 
            ? `${this.baseURI}/${this.account}/${this.group}/${this.artifact}` 
            : null;
    }

    getCollectionURI() {
        return this.artifact != null
            ? `${this.baseURI}/${this.account}/${DatabusResource.DATABUS_COLLECTION_GROUP}/${this.artifact}` 
            : null;
    }

    getVersionURI() {
        return this.version != null 
            ? `${this.baseURI}/${this.account}/${this.group}/${this.artifact}/${this.version}` 
            : null;
    }

    getBaseURI() {
        return this.baseURI;
    }

    isVersion() {
        return this.version != null;
    }

    isArtifact() {
        return this.artifact != null && this.version == null && DatabusResource.DATABUS_COLLECTION_GROUP !== this.group;
    }

    isCollection() {
        return this.artifact != null && this.version == null && DatabusResource.DATABUS_COLLECTION_GROUP === this.group;
    }

    isGroup() {
        return this.group != null && this.artifact == null;
    }

    isAccount() {
        return this.account != null && this.group == null;
    }

    getTypeName() {
        if(this.isVersion()) {
            return "version";
        }

        if(this.isArtifact()) {
            return "artifact";
        }

        if(this.isCollection()) {
            return "collection"
        }
        
        if(this.isGroup()) {
            return "group";
        }

        if(this.isAccount()) {
            return "account"
        }
    }
}

module.exports = DatabusResource;