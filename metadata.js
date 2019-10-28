const axios = require("axios");
const log4js = require("log4js");

//set logger level
const logger = log4js.getLogger();

let cache = {
    metadata: {},
    phenotypes: {}
};

function getMetadata(config) {
    let url = `http://${config.kb.host}:${config.kb.port}/dccservices/getMetadata?mdv=${config.kb.mdv}`;

    logger.info('Fetching metadata from KB...');
    logger.info("helllo meta");

    return axios
        .get(url)
        .then(response => cache.metadata = response.data)
        .catch(error => logger.error(error));
}

function getPhenotypedata(config) {
    let url = `http://${config.kb.host}:${config.kb.port}/dccservices/graph/phenotype/list/object`;
    
    logger.info('Fetching list of phenotype maps from graph DB...');
    logger.info("hello pheno" + url);

    return axios
        .get(url)
        .then(response => cache.phenotypes = response.data)
        .catch(error => logger.error(error));
}

module.exports = {
    getMetadata: getMetadata,
    getPhenotypedata: getPhenotypedata,
    cache
};
