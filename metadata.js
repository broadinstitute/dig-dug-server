
const request = require('request');
var cachedMetadata;
var cachedPhenotypes;
var cachedDatasets;
const axios = require('axios');
const util = require('util')

function getMetadata(config)
{
  let host = config.kb.host;
  let port = config.kb.port;
  let expose = config.kb.expose;
  let mdv = config.kb.mdv;
  let baseurl = "http://" + host + ":" + port;

//build a baseurl
  var kbPath = baseurl + "/dccservices/getMetadata?mdv=" + mdv;

axios.get(kbPath)
.then(function (response){
  cachedMetadata = response.data;
  console.log(cachedMetadata);
})
.catch(function(error){
  console.log(error)
})
}

function getDatasets(){
    
  //traverse the cachedMetadata and get the datasets
  return cachedMetadata.experiments;

}

function getPhenotypes(){
  //traverse the cachedMetadata and get the phenotypes

}


module.exports = {
  getMetadata: getMetadata,
  getPhenotypes: getPhenotypes
}
