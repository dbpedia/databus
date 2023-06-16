const AppJsonFormatter = require("../utils/app-json-formatter");
const SearchAdapter = require("./search-adapter");

class SearchManager {

    constructor($http, $interval) {
        this.http = $http;
        this.searchExtensions = [];

        var baseAdapter = SearchAdapter.lookup(this.http, `/api/search`);
        this.searchExtensions.push({
            endpointUri: `/api/search`,
            adapterName: `lookup`,
            adapter: baseAdapter
        });
    }

    async search(queryUrl) {
        for (var searchExtension in this.searchExtensions) {


            
        }

        var url = `/api/search?query=${ctrl.searchInput}${ctrl.searchFilter}${baseFilters}${typeFilters}`;
      $http({
        method: 'GET',
        url: url
      }).then(function successCallback(response) {
        ctrl.isSearching = false;
        ctrl.results = response.data;
      }, function errorCallback(response) {
        ctrl.isSearching = false;
      });
    }

    async initialize() {

        var auth = data.auth;

        if (!auth.authenticated) {
            return;
        }

        var options = {
            method: 'GET',
            url: `/${auth.info.accountName}`,
            headers: {
                'Accept': 'application/ld+json',
                'X-Jsonld-Formatting': 'flatten'
            }
        }

        var response = await this.http(options);
        var accountData = AppJsonFormatter.formatAccountData(response.data);
        var extensions = JSON.parse(JSON.stringify(accountData.searchExtensions));

        for (var searchExtension of extensions) {

            switch (searchExtension.adapterName) {
                case 'lookup':
                    searchExtension.adapter = SearchAdapter.lookup(this.http, searchExtension.endpointUri);
                    break;
            }

            this.searchExtensions.push(searchExtension);

        }
    }
}

module.exports = SearchManager;
