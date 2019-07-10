
const request = require('request');
var cachedMetadata;
var cachedPhenotype;
var cachedDataset;
const axios = require('axios');
const util = require('util')

function getMetadata(host, port, mdv)
{
//build a baseurl
var kbPath = "http://" + host + ":" + port + "/dccservices/getMetadata?mdv=" + mdv;
// request(path, function(error, response, body)
// {
//   cachedMetadata = JSON.parse(body);
// })//get the data and store it in global variable
axios.get(kbPath)
.then(function (response){
  cachedMetadata = response.data;
  console.log(cachedMetadata);
})
.catch(function(error){
  console.log(error)
})
}

function getPhenotypes(){
  //traverse the cachedMetadata and get the phenotypes
  let phenotypes = cachedMetadata.experiments;
  console.log("phenotypes are: " + phenotypes);
}


module.exports = {
  getMetadata: getMetadata,
  getPhenotypes: getPhenotypes
};
