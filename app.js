const buildOptions = require('minimist-options');
const minimist = require('minimist');
const log4js = require('log4js');

const config = require('./config'); //load config file
const server = require('./server'); //load server file

//set logger level
const logger = log4js.getLogger();
//logger.level = 'all';

const options = buildOptions({	//config arguments for commandline
	config: {
		type: 'string',
		alias: 'c',
		default: 'config.yml'
	},
	www: {
		type: 'string',
		alias: 'w',
		default: ''
	}
});
const args = minimist(process.argv.slice(2), options);

//const startConfig = config.loadConfig('config.yml'); //load config yml file
//const localConfig = config.loadConfig('config_local.yml'); //local static www folder

//console.log("hey: " + JSON.stringify(args, null, 4));
//console.log("there: " + args.config);

let override_msg = args.www ? `with www=${args.www} ` : '';
logger.info(`Loading configuration file ${args.config} ${override_msg}and starting server ...`);
//server.start(localConfig); // start the node js server

server.start(config.loadConfig(args.config), args.www); //load the necessary config file, and overwrite if any