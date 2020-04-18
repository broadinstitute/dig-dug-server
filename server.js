
const ExpressGA = require("express-universal-analytics")
const express = require("express");
const requestIp = require('request-ip');
const cookieParser = require("cookie-parser");
const path = require("path");
const log4js = require("log4js");
const google = require("./google");
const logins = require("./logins");

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

function create_routes(config, app) {
    // Google OAuth
    app.get("/login", google.logInLink);
    app.get("/logout", logOut);
    app.get("/oauth2callback", google.oauth2callback);

    // main distribution/resource folder
    app.use("/", express.static(config.content.dist));
}

function logOut(req, res) {
    res.clearCookie("session", { domain: getDomain(req.hostname) });
    res.redirect("/");
}

//get domain from hostname
function getDomain(host) {
    let parts = host.split(".");
    if (parts.length >= 2) {
        return parts[parts.length - 2] + "." + parts[parts.length - 1];
    } else return host;
}

function validateConfig(config) {
    let valid = true;

    if (!config.content.dist) {
        logger.error("Missing content.dist from configuration.");
        valid = false;
    }

    return valid;
}

// middleware that creates an anonymous session when no registered user session is seen
function getOrCreateSession() {
    return function (req, res, next) {

        let fullClientIp = requestIp.getClientIp(req);
        logger.debug('fullClientIp:', fullClientIp);
        let clientIpPart = fullClientIp.split(':');
        logger.debug('clientIpPart:', clientIpPart);
        let clientIp = clientIpPart[clientIpPart.length - 1]
        logger.debug('Client IP:', clientIp);

        logger.debug("Request Headers:\n", JSON.stringify(req.headers));
        logger.debug('Request Type:', req.method);

        let session = false;
        if (req.cookies) {
            session = req.cookies.session;
        }

        if (session) {
            logger.debug('Session found! User email:', session[0]);
        } else {
            // Attempt to create a synthetic but functional session object?
            session = [
                ''.concat("anonymous@",clientIp),
                "anonymous",
                "access_token",
                "false"
            ];
            // spoof the request to include the new session cookie as well?
            req.cookies.session = res.cookie("session", session, {
                domain: req.hostname //require explicit domain set to work with subdomains
            });
        }
        logger.debug('Session: ', session);

        next();
    };
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

    // Elaborated session management
    app.use(getOrCreateSession());

    /*
     Will only insert middleware to process Google Analytics if a non-empty
     Google Analytics Property Tracking identifier of format "UA-#########-#"
     is configured in the config file under tag config.auth.google.UAId
     */
    let ua_id = config.auth.google.UAId;
    if (ua_id) {
        app.use(ExpressGA(ua_id));
    }

    // express settings
    app.set("views", path.join(__dirname, "views"));
    app.set("view engine", "pug");

    // setup routes
    create_routes(config, app);

    // google auth
    google.useConfig(config);

    // technically this is optional, but logins won't work if it fails
    logins.connectToDatabase(config);

    // get metadata before starting server
    app.listen(port, () => logger.info(`Server started on port ${port}...`));
}

module.exports = {
    start: start
};
