
const request = require('request');
const axios = require('axios');
const util = require('util');


var cache = {
  metadata: undefined,
  phenotypes: [],
  datasets: [],
}

function getMetadata(config)
  {
    let host = config.kb.host;
    let port = config.kb.port;
    let expose = config.kb.expose;
    let mdv = config.kb.mdv;
    let baseurl = "http://" + host + ":" + port;
    //build a baseurl
    var kbPath = baseurl + "/dccservices/getMetadata?mdv=" + mdv;
    return axios.get(kbPath) //returns a promise
    .then(function (response){
        //setting the metadata
        cache.metadata = response.data;
        var datasets = getDatasets();
        var phenotypes = getPhenotypes();
        return 10;
    })
    .catch(function(error){
        console.log(error)
    })
  }

function getDatasets(){
    console.log("I am getting the datasets" + cache.metadata);
    var datasetArray = [];
    var datasetNameIdMap = {};
    for (item in cache.metadata ){
        for (subitem in cache.metadata [item]){
            Object.keys(cache.metadata [item][subitem]).forEach(key => {
                var sampleGroups = cache.metadata [item][subitem]['sample_groups'];
                for (sampleGroup in sampleGroups){
                    Object.keys(sampleGroups[sampleGroup]).forEach(key => {
                        if (datasetArray.indexOf(sampleGroups[sampleGroup]['id'])==-1) datasetArray.push(sampleGroups[sampleGroup]['id']);
                    });
                }
            })
        }
    }
    //console.log(datasetArray);
}

//initially create the map without any key
var map = {};

function addValueToList(key, value) {
    //if the list is already created for the "key", then uses it
    //else creates new list for the "key" to store multiple values in it.
    map[key] = map[key] || [];
    map[key].push(value);
}


function getPhenotypes(){
    //DONT USE VAR
  var phenotypeMap = {};

  //traverse the cachedMetadata and get the phenotypes
  for (item in cache.metadata){
      for (subitem in cache.metadata [item]){
          Object.keys(cache.metadata [item][subitem]).forEach(key => {
              let sampleGroups = cache.metadata [item][subitem]['sample_groups'];
              for (sampleGroup in sampleGroups){
                  Object.keys(sampleGroups[sampleGroup]).forEach(key => {
                    let phenotypeObj = sampleGroups[sampleGroup]['phenotypes'];
					let sameGroupArray = [];
                    for(keyWord in phenotypeObj){
                        let keys = Object.keys(phenotypeObj[keyWord])
                        let groupName = phenotypeObj[keyWord]['group']; // this will be the key
                        let phenotypeName = phenotypeObj[keyWord]['name']; // this will be added to a list and mapped to its groupName
						if(groupName in phenotypeMap){
						//if the key already exists in the map
							console.log(groupName + "I already exist");
                            if (sameGroupArray.indexOf(phenotypeName)==-1) sameGroupArray.push(phenotypeName);
							phenotypeMap[groupName] = sameGroupArray;
							}
						else{
							sameGroupArray = [];
							if (sameGroupArray.indexOf(phenotypeName)==-1) sameGroupArray.push(phenotypeName);
							phenotypeMap[groupName] = sameGroupArray;
						}
                    }

                  })
              }
          })
      }
  }

console.log(phenotypeMap);

}


module.exports = {
  getMetadata: getMetadata,
  getPhenotypes: getPhenotypes,
  getDatasets: getDatasets
}
