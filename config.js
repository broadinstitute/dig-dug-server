const yaml = require("js-yaml");
const fs = require("fs");
const appRoot = require("app-root-path");
const merge = require("lodash.merge");

function readConfig(file) {
    return yaml.safeLoad(fs.readFileSync(file, "utf-8"));
}

function loadConfig(overrideFile) {
    //need appRoot for cases where node is not run from app directory
    let defaultConfig = readConfig(appRoot + "/config.yml");
    let overwriteConfig = overrideFile ? readConfig(overrideFile) : {};

    /* The last files will take the highest precedence */
    let config = merge(defaultConfig, overwriteConfig); //can be chained if needed
    //console.log("config: " + JSON.stringify(config, null, 4));
    return config;
}

module.exports = {
    loadConfig: loadConfig
};
