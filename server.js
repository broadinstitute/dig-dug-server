const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const request = require("request");
const log4js = require("log4js");
const metadata = require("./metadata");
const google = require("./google");

let logger = undefined;

function enable_logging(config) {
    let logfile = config.log;
    let type = "file";

    if (logfile == "stdout") {
        type = logfile;
        logfile = undefined;
    }

    log4js.configure({
        appenders: {
            out: {
                type: type,
                filename: logfile,
                layout: {
                    type: "pattern",
                    pattern: "%[[%p] %f{1}:%l >>%] %m"
                }
            }
        },
        categories: {
            default: { appenders: ["out"], level: "all", enableCallStack: true }
        }
    });

    // set the global logger
    logger = log4js.getLogger();
}

function route_kb_api_requests(config, app) {
    let host = config.kb.host;
    let port = config.kb.port;
    let expose = config.kb.expose;
    let mdv = config.kb.mdv;

    //REMEMBER TO ENABLE SSL BEFORE GOING LIVE
    let baseurl = "http://" + host + ":" + port;
    let routeNames = Object.keys(expose); //what entry names are exposed?

    routeNames.forEach(name => {
        let data = expose[name];
        //build the api link
        let apiPath = baseurl + data.urlpath;
        if (data.method == "POST") {
            app.post(`/kb/${name}`, (req, res) => {
                req.pipe(
                    request({ qs: req.query, uri: apiPath, json: true })
                ).pipe(res);
            });
        } else if (data.method == "GET") {
            app.get(`/kb/${name}*`, (req, res) => {
                console.log("query", req.query);
                //REMEMBER - check url exists
                req.pipe(
                    request({ qs: req.query, uri: apiPath, json: true })
                ).pipe(res);
            });
        }
    });
}

function create_routes(config, app) {

    // Google OAuth
    app.get("/login", google.logInLink);
    app.get("/oauth2callback", google.oauth2callback);

    // metadata routes
    app.get("/kb/getMetadata", (req, res) => {
        res.json(metadata.cache.metadata);
    });

    app.get("/kb/getPhenotypedata", (req, res) => {
        res.json(metadata.cache.phenotypes);
    });

    // KB routes
    route_kb_api_requests(config, app);

    //
    app.use("/", express.static(config.content.dist));
}

//start function
function start(config) {
    let port = config.port || 80;
    let app = express();

    // setup logging
    enable_logging(config);

    // express plugins
    app.use(cookieParser());

    // express settings
    app.set("views", path.join(__dirname, "views"));
    app.set("view engine", "pug");

    // setup routes
    create_routes(config, app);

    // google auth
    google.useConfig(config);

    // get metadata before starting server
    metadata.getMetadata(config)
    .then(() => {metadata.getPhenotypedata(config); logger.info(`Getting Phenotypes ...`)})
    .then(() => {app.listen(port, () => logger.info(`Server started on port ${port}...`));
  
});
}

module.exports = {
    start: start
};
