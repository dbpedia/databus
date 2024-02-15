const AppJsonFormatter = require("../utils/app-json-formatter");
const SearchAdapter = require("./search-adapter");

class SearchManager {

    constructor($http, $interval) {
        this.http = $http;
        this.searchExtensions = [];

        this.baseAdapter = SearchAdapter.lookup(this.http, `/api/search`);
        this.searchExtensions.push({
            endpointUri: `/api/search`,
            adapterName: `lookup`,
            adapter: this.baseAdapter
        });
    }

    mergeResults(results, documents) {
        for(var document of documents) {
            results.push(document);
        }

        return results;
    }

    async search(queryUrl, documentFilter) {

        var results = [];

        for (var searchExtension of this.searchExtensions) {

            try {

                var documents = await searchExtension.adapter.search(queryUrl);

                if(documentFilter != undefined) {
                    documents = documents.filter(documentFilter);
                }
                
                results = this.mergeResults(results, documents);

            } catch(err) {

            }
        }

        return results;
    }

    async initialize() {

        var auth = data.auth;

        if (!auth.authenticated) {
            return;
        }

        if(auth.info.accountName == undefined) {
            return;
        }

        /*

        var options = {
            method: 'GET',
            url: `/${ auth.info.accountName }`,
            headers: {
                'Accept': 'application/ld+json',
                'X-Jsonld-Formatting': 'flatten',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
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

        })*/
    }
}

module.exports = SearchManager;
