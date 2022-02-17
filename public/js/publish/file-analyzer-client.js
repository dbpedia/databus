/**
 * Handles shasum creation (and possibly other file stats)
 */
class ShasumClient {

  constructor(q, proxyUri, maxStreams) {
    this.proxyUri = proxyUri;
    this.q = q;
    this.maxStreams = maxStreams;

    this.processes = {};
    this.streamQueue = [];

    // this.authHeader = { "Authorization": "Bj5pnZEX6DkcG6Nz6AjDUT1bvcGRVhRaXDuKDX9CjsEs2" };
  }

  getActiveProcessCount() {
    var processCount = 0;
    for(var p in this.processes) {
      if(!this.processes[p].isDone) {
        processCount++;
      }
    }

    return processCount;
  }

  analyzeFile(file) {

    var processCount = this.getActiveProcessCount();

    if(processCount < this.maxStreams) {
      this.startSha256Task(file);

    } else {
      this.streamQueue.push(file);
    }
  }

  analyzeAllFiles(files) {
    this.processes = {};
    this.streamQueue = [];

    for (var f in fileGroups) {

      var fileGroup = fileGroups[f]

      for (var d in fileGroup.distributions) {

        var distribution = fileGroup.distributions[d];
        this.streamQueue.push(distribution);
      }
    }

    // start the first {maxStreams} file streams
    for (var i = 0; i < Math.min(this.streamQueue.length, this.maxStreams); i++) {
      this.startSha256Task(this.streamQueue[i]);
    }

    this.streamQueue.splice(0, this.maxStreams);
    return this.shasumCreationProcess;

  }

  startShasumGeneration(fileGroups) {

    this.processes = {};
    this.streamQueue = [];

    for (var f in fileGroups) {

      var fileGroup = fileGroups[f]

      for (var d in fileGroup.distributions) {

        var distribution = fileGroup.distributions[d];
        this.streamQueue.push(distribution);
      }
    }

    // start the first {maxStreams} file streams
    for (var i = 0; i < Math.min(this.streamQueue.length, this.maxStreams); i++) {
      this.startSha256Task(this.streamQueue[i]);
    }

    this.streamQueue.splice(0, this.maxStreams);
    return this.shasumCreationProcess;
  }

  hasError(fileGroup) {
    for (var d in fileGroup.distributions) {
      var dist = fileGroup.distributions[d];
      if (this.processes[dist.uri].hasError) {
        return true;
      }
    }

    return false;
  }

  isSuccess(fileGroup) {
    for (var d in fileGroup.distributions) {
      var dist = fileGroup.distributions[d];
      var process = this.processes[dist.uri];

      if (process == undefined || !process.isDone || process.hasError) {
        return false;
      }
    }

    return true;
  }

  isDone() {

    if (this.streamQueue > 0) {
      return false;
    }

    // stream queue is empty
    for (var p in this.processes) {
      if (!this.processes[p].isDone) {
        return false;
      }
    }

    return true;
  }

  onShasumFinished() {

    if (this.streamQueue.length > 0) {
      this.startSha256Task(this.streamQueue[0]);
      this.streamQueue.splice(0, 1);
    }
  }

  startSha256Task = function (file) {

    var process = {}
    process.isDone = false;

    var self = this;

    this.generateSha256Deferred(file).then(function (success) {

      process.result = success.result;
      process.isDone = true;
      process.isSuccess = true;

      file.byteSize = success.result.byteSize;
      file.sha256sum = success.result.shasum;
      self.onShasumFinished();

    }, function (error) {
      process.result = error;
      process.isDone = true;
      process.hasError = true;

      self.onShasumFinished();
    }, function (update) {
      process.progress = update.progress;
    });

    this.processes[file.uri] = process;
  }

  generateSha256Deferred = function (file) {

    var deferred = this.q.defer();
    var proxyUri = this.proxyUri + encodeURIComponent(file.uri);


    fetch(proxyUri, { headers: this.authHeader, credentials: 'include' }).then(function (fetchResult) {

      var contentSize = 0;
      var shasum = null;
      var result = null;
      var decoder = new TextDecoder("utf-8");

      var reader = fetchResult.body.getReader();
      function push(reader) {

        return reader.read().then(({ done, value }) => {

          var chunk = decoder.decode(value);
          var updates = chunk.split('$');

          for (var u in updates) {
            var update = updates[u];

            if (update.includes('/')) {
              var p = updates[u].split('/');
              deferred.notify({ uri: file.uri, progress: Math.floor(100 * p[0] / p[1]) });
              contentSize = p[1];
            } else if (updates != undefined && update.length > 0) {
              result = JSON.parse(update);
            }
          }

          if (done) {

            deferred.resolve({ uri: file.uri, result: result });
            return true;
          }

          push(reader);

        }, function (err) {
          deferred.reject({ uri: file.uri, message: err });
        });
      };

      push(reader);

    }, function (err) {
      deferred.reject({ uri: file.uri, message: err });
    });

    return deferred.promise;
  }
}