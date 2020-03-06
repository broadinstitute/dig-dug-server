const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const request = require("request");
const log4js = require("log4js");
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

function create_routes(config, app) {
    // Google OAuth
    app.get("/login", google.logInLink);
    app.get("/logout", logOut);
    app.get("/oauth2callback", google.oauth2callback);

    // main distribution/resource folder
    app.use("/", express.static(config.content.dist));
}

function logOut(req, res) {
    //clear all cookies and redirect home
    res.clearCookie("name");
    res.clearCookie("email");
    res.redirect("/");
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
    app.listen(port, () =>
        logger.info(`Server started on port ${port}...`)
    );
}

module.exports = {
    start: start
};
