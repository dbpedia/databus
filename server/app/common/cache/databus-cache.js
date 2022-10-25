var NodeCache = require('node-cache');

class DatabusCache {

   constructor(time) {
      this.cache = new NodeCache({ stdTTL: time, checkperiod: time });
   }

   has(cacheKey) {
     return this.cache.get(cacheKey) != undefined;
   }

   set(cacheKey, data) {
    this.cache.set(cacheKey, data);
   }

   async get (cacheKey, promiseFactory) {

      var cachedData = this.cache.get(cacheKey);
   
      if (cachedData != undefined) {
         return cachedData;
      }
   
      var data = await promiseFactory();
   
      this.cache.set(cacheKey, data);
      return data;
   }
}

module.exports = DatabusCache;


