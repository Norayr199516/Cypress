export class Utility {
    getApiUrl() {
        let envi = Cypress.env('ENV'); //Get the value of evnironment variable i.e ENV
        if (envi == 'local')
            return "";  // required local URL
        else if (envi == 'staging')
            return "https://escripts-stg.nowrx.com";
        else if (envi == 'preProd')
            return "https://preprod.nowrx.com";
    }
    getUrl() {
        let envi = Cypress.env('ENV'); //Get the value of evnironment variable i.e ENV
        if (envi == 'local')
            return "";  // required local URL
        else if (envi == 'staging')
            return "https://int.quickfill.dev/";
        else if (envi == 'preProd')
            return "https://ui-preprod.nowrx.com/";
    }
}