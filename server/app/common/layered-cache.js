var NodeCache = require('node-cache');

class LayeredCache {

  constructor(timeShort, timeLong) {
    this.shortTerm = new NodeCache({ stdTTL: timeShort, checkperiod: timeShort });
    this.longTerm = new NodeCache({ stdTTL: timeLong, checkperiod: timeLong });
  }

  async get(cacheKey, promiseFactory) {

    var self = this;

    // Check short term cache
    var cachedData = this.shortTerm.get(cacheKey);

    // Short-term ran out and needs to be renewed
    if (cachedData == null) {

      // Check long term cache
      var cachedData = this.longTerm.get(cacheKey);

      // No long term fallback, block!
      if (cachedData == null) {
        cachedData = await promiseFactory();
        this.longTerm.set(cacheKey, cachedData);
        this.shortTerm.set(cacheKey, cachedData);
      } else {

        // Long term memory needs an async refresh
        promiseFactory().then(function (result) {
          console.log(`Async refresh for cache key ${cacheKey} complete.`);
          self.longTerm.set(cacheKey, result);
          self.shortTerm.set(cacheKey, result);
        });
      }

    }
    return cachedData;
  }
}

module.exports = LayeredCache;
