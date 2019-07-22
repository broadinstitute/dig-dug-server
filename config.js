const yaml = require('js-yaml');
const fs = require('fs');


function loadConfig(fileName){
  return yaml.safeLoad(fs.readFileSync(fileName, 'utf-8'));

}

module.exports = {
  loadConfig: loadConfig
};
