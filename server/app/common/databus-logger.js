const DatabusLogLevel = require("./databus-log-level");

class DatabusLogger {


  constructor(level) {
    this.entries = [];
    this.level = level;

    if (this.level != DatabusLogLevel.DEBUG
      && this.level != DatabusLogLevel.INFO
      && this.level != DatabusLogLevel.ERROR) {
        this.level = DatabusLogLevel.ERROR;
    }
  }

  getReport() {
    return {
      logLevel: this.level,
      log: this.entries
    };
  }

  log(level, resource, message, payload) {
    if (level == DatabusLogLevel.DEBUG) {
      this.debug(resource, message, payload);
    }

    if (level == DatabusLogLevel.INFO) {
      this.info(resource, message, payload);
    }

    if (level == DatabusLogLevel.ERROR) {
      this.error(resource, message, payload);
    }
  }

  info(resource, message, payload) {
    if (this.level == DatabusLogLevel.ERROR) {
      return;
    }

    this.entries.push({ resource: resource, msg: message, payload: payload, level: DatabusLogLevel.INFO });
  }

  error(resource, message, payload) {
    this.entries.push({ resource: resource, msg: message, payload: payload, level: DatabusLogLevel.ERROR });
  }

  debug(resource, message, payload) {

    console.log(message);
    if (this.level != DatabusLogLevel.DEBUG) {
      return;
    }

    this.entries.push({ resource: resource, msg: message, payload: payload, level: DatabusLogLevel.DEBUG });
  }
}

module.exports = DatabusLogger;
