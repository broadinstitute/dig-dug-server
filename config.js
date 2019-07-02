const yaml = require('js-yaml');
const fs = require('fs');

try {
    const config = yaml.safeLoad(fs.readFileSync('config.yml', 'utf-8'));
    //const show = JSON.stringify(config, null, 4);
    //console.log(show);

} catch (e) {
    console.log(e);

}

module.exports.config;