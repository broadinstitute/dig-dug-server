//const server = require('./server'); //load server file
const config = require('./config'); //load config file
const opts = require('optparse'); //load option parser library


var server = require('./server');

var startConfig = config.loadConfig(`config.yml`);
server.start(startConfig);
