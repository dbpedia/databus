const AppJsonFormatter = require("../utils/app-json-formatter");
const SearchAdapter = require("./search-adapter");

class SearchManager {

    constructor($http, $interval) {
        this.http = $http;
        this.searchExtensions = [];

        this.searchExtensions.push({

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

        this.searchExtensions = JSON.parse(JSON.stringify(accountData.searchExtensions));

        for (var searchExtension of this.searchExtensions) {

            switch (searchExtension.adapterName) {
                case 'lookup':
                    searchExtension.adapter = SearchAdapter.lookup(this.http, searchExtension.endpointUri);
                    break;
            }

        }
    }
}

module.exports = SearchManager;
