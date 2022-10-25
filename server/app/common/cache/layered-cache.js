var NodeCache = require('node-cache');

/**
 * The layered cache wraps to node caches.
 * One cache is the short term memory - it is short lived and hits are returned directly
 * The other cache is the long term memory. A miss in the short term memory and a hit in the 
 * long term memory indicates that the cache still holds something, but that something might
 * be outdated. Should a long term hit occur (since the short term missed), the cache data is 
 * updated asynchronously while returning the long term cache hit. The next user (or a browser refresh)
 * will then receive the latest data.
 * 
 * Only a miss in both caches creates a blocking procedure.
 */
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
          // console.log(`Async refresh for cache key ${cacheKey} complete.`);
          self.longTerm.set(cacheKey, result);
          self.shortTerm.set(cacheKey, result);
        });
      }

    }
    return cachedData;
  }
}

module.exports = LayeredCache;
