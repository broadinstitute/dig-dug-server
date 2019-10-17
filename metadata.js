const axios = require("axios");
const log4js = require("log4js");

//set logger level
const logger = log4js.getLogger();

let cache = {
    metadata: {},
};

function getMetadata(config) {
    let url = `http://${config.kb.host}:${config.kb.port}/dccservices/getMetadata?mdv=${config.kb.mdv}`;

    logger.info('Fetching metadata from KB...');

    return axios
        .get(url)
        .then(response => cache.metadata = response.data)
        .catch(error => logger.error(error));
}

module.exports = {
    getMetadata: getMetadata,
    cache
};
