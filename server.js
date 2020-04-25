const ExpressGA = require("express-universal-analytics")
const express = require("express");
const express_session = require('express-session')

const cookieParser = require("cookie-parser");
const path = require("path");
const log4js = require("log4js");
const google = require("./google");
const logins = require("./logins");

let logger = undefined;

function enable_logging(config) {
    let logfile = config.log;
    let type = "file";

    if (logfile === "stdout") {
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

    // Google Analytics event callback (see eventLog function below for further details)
    app.get("/eventlog", eventLog);

    // main distribution/resource folder
    app.use("/", express.static(config.content.dist));
}

function logOut(req, res) {
    res.clearCookie(logins.cookieName, { domain: getDomain(req.hostname) });
    res.redirect("/");
}


//get domain from hostname
function getDomain(host) {
    let parts = host.split(".");
    if (parts.length >= 2) {
        return parts[parts.length - 2] + "." + parts[parts.length - 1];
    } else return host;
}


/**
 * Event Log web service endpoint for Google Analytics reporting.
 * Endpoint path is of form '/eventlog?action=click&category=gwas&label=show_variants&value=true'
 *
 * @param {Request} [req]
 * @param {Response} [res]
 * @return {Send}
 * @public
 */
function eventLog(req, res) {

    let host = getDomain(req.headers['host']);
    let action = 'visit';
    let category = 'route';
    let label = 'sample';
    let value = '1';

    if (req.query['action']) {
        action = req.query['action'];
    }
    if (req.query['category']) {
        category = req.query['category'];
    }
    if (req.query['label']) {
        label = req.query['label'];
    }
    if (req.query['value']) {
        value = req.query['value'];
    }

    logger.debug("Google Analytic event logged for '".concat(
        host,"'[Action:'",action,"', Category:'",category,"', Label:'",label,"=",value,"']"));

    req.visitor.event({
        dp: req.originalUrl,
        ea: action,
        ec: category,
        el: label,
        ev: value,
    }).send();

    res.send(host.concat(" '",action,"' event handled!"));
}


function validateConfig(config) {
    let valid = true;

    if (!config.content.dist) {
        logger.error("Missing content.dist from configuration.");
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

    // technically this is optional, but logins won't work if it fails
    // RMB: moved the database connection method up here
    // in advance of the express_session initialisation?
    // TODO: modify the logins database to apply it to the express-session
    logins.connectToDatabase(config);

    // Deploy the Express session middleware
    // TODO: need review on how it is being used, and perhaps adapt to Portal session management(?)
    app.use(
        express_session(
            {
                secret: config.session.secret,
                resave: false,
                saveUninitialized: false,
                cookie: {
                    maxAge: config.session.cookie.maxAge,


                },
            })
    );

    // express plugins
    app.use(cookieParser());

    // Elaborated session management
    app.use(logins.captureClientIp());

    // Elaborated session management
    // TODO: may not need this if one uses the express-session management?
    app.use(logins.captureSession());

    /*
     Will only insert middleware to process Google Analytics if a non-empty
     Google Analytics Property Tracking identifier of format "UA-#########-#"
     is configured in the config file under tag config.auth.google.UAId
     */
    let ua_id = config.auth.google.UAId;
    if (ua_id) {
        app.use(
            ExpressGA(
                {
                    uaCode: ua_id,
                    // default GA cookie '_ga' assumed
                    // extract user id from request
                    reqToUserId: (req) => req.cookies && req.cookies[logins.cookieName],
                }

            )
        );
    }

    // express settings
    app.set("views", path.join(__dirname, "views"));
    app.set("view engine", "pug");

    // setup routes
    create_routes(config, app);

    // google auth
    google.useConfig(config);

    // get metadata before starting server
    app.listen(port, () => logger.info(`Server started on port ${port}...`));
}

module.exports = {
    start: start
};
