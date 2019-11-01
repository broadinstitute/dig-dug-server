const buildOptions = require("minimist-options");
const minimist = require("minimist");
const log4js = require("log4js");

const config = require("./config"); //load config file
const server = require("./server"); //load server file

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

logger.info("Starting server ...");

server.start(config.loadConfig(args.config)); //load the necessary config file, and start server
