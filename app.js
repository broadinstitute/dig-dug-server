
const config = require('./config'); //load config file
const opts = require('optparse'); //load option parser library
const server = require('./server'); //load server file
const startConfig = config.loadConfig(`config.yml`); //load config yml file
const localConfig = config.loadConfig(`config_local.yml`); //local static www folder

server.start(localConfig); // start the node js server
