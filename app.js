const buildOptions = require("minimist-options");
const minimist = require("minimist");
const log4js = require("log4js");

const fs = require("fs");
const http = require("http");
const https = require("https");

const config = require("./config");
const server = require("./server");

//set logger level
const logger = log4js.getLogger();
//logger.level = 'all';

const options = buildOptions({
    //config arguments for commandline
    config: {
        type: "string",
        alias: "c",
        default: ""
    }
});
const args = minimist(process.argv.slice(2), options);

if (args.config) {
    logger.info(`Overwriting configurations with file ${args.config}.`);
}

const loadedConfig = config.loadConfig(args.config);
const app = server.start(loadedConfig); //load the necessary config file, and start server

if (!!loadedConfig.port) {
    // app.listen(args.config.port, () => logger.info(`Server started on port ${args.config.port}...`));
    const httpServer = http.createServer(app);
    httpServer.listen(loadedConfig.port, () => logger.info(`HTTP Server started on port ${loadedConfig.port}...`));
}

if (!!loadedConfig.https && !!loadedConfig.https.key && !!loadedConfig.https.crt) {
    var privateKey  = fs.readFileSync(loadedConfig.https.key, 'utf8');
    var certificate = fs.readFileSync(loadedConfig.https.crt, 'utf8');
    var credentials = { key: privateKey, cert: certificate };

    var httpsServer = https.createServer(credentials, app);
    httpsServer.listen(loadedConfig.https.port, () => logger.info(`HTTPS Server started on port ${loadedConfig.https.port}...`));
} else {
    logger.info(`No HTTPS config given.`)
}

