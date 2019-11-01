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

    // proxy all POST and GET requests to the KB
    app.use('/dccservices/*', (req, res) => {
        let proxy = {
            uri: `http://${host}:${port}${req.baseUrl}`,
            qs: req.query,
            json: true,
        };

        req.pipe(request(proxy)).pipe(res);
    });
}

function create_routes(config, app) {
    // Google OAuth
    app.get("/login", google.logInLink);
    app.get("/oauth2callback", google.oauth2callback);

    // metadata routes
    app.get("/cache/getMetadata", (req, res) => {
        res.json(metadata.cache.metadata);
    });

    // KB routes
    route_kb_api_requests(config, app);

    // main distribution/resource folder
    app.use("/", express.static(config.content.dist));
}

function validateConfig(config) {
    let valid = true;

    if (!config.content.dist) {
        logger.error("Missing content.dist from configuration.");
        valid = false;
    }

    if (!config.kb.mdv) {
        logger.error("Missing kb.mdv from configuration.");
        valid = false;
    }

    return valid;
}
//start function
function start(config) {
    // setup logging
    enable_logging(config);

    let valid = validateConfig(config);
    if (!valid) {
        logger.warn("Check your configuration file and try again.");
        return;
    }

    let port = config.port || 80;
    let app = express();

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
    metadata.getMetadata(config).then(() => {
        if (!metadata.cache.metadata) {
            logger.error(
                "No metadata received. Please check your connection and try again."
            );
        } else {
            app.listen(port, () =>
                logger.info(`Server started on port ${port}...`)
            );
        }
    });
}

module.exports = {
    start: start
};
