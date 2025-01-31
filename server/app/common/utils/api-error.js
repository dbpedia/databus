class ApiError extends Error {
    constructor(statusCode, resource, message, body) {
        super(message);
        this.name = "ApiError";
        this.statusCode = statusCode;
        this.resource = resource;
        this.body = body;
    }
}

module.exports = ApiError;