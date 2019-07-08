
const request = require('request');
var cachedMetadata;

function getMetadata(host, port, mdv)
{
//build a baseurl
var path = "http://" + host + ":" + port + "/dccservices/getMetadata?mdv=" + mdv;
request(path, function(error, response, body)
{
  cachedMetadata = JSON.parse(body);
})//get the data and store it in global variable
}



function getPhenotypes(){
  //traverse the cachedMetadata and get the phenotypes
  let phenotypes = cachedMetadata.experiments;
}


module.exports = {
  getMetadata: getMetadata,
  getPhenotypes: getPhenotypes
}
