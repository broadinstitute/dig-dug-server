const yaml = require("js-yaml");
const fs = require("fs");
const lodash = require("lodash.merge");

function readConfig(file) {
    return yaml.safeLoad(fs.readFileSync(file, "utf-8"));
}

function mergeConfig(file) {
    let defaultConfig = readConfig("config.yml"); //load default config
    let overwriteConfig = readConfig(file); //load overwrite config

    /* The last files will take the highest precedence */
    return lodash(defaultConfig, overwriteConfig); //can be chain if needed
}

function loadConfig(file) {
    let config = file != "config.yml" ? mergeConfig(file) : readConfig(file);
    //console.log("config: " + JSON.stringify(config, null, 4));
    return config;
}

module.exports = {
    loadConfig: loadConfig
};
