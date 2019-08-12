const request = require('request');
const axios = require('axios');
const util = require('util');
const log4js = require('log4js');

//set logger level
const logger = log4js.getLogger();
logger.level = 'all';

var cache = {
	metadata: undefined,
	phenotypes: [],
	datasets: []
};

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
		})
		.then(function (response){
			//caching datasets and phenotypes
			cache.datasets = getDatasets();
			cache.phenotypes = getPhenotypes();
		})
		.catch(function(error){
			logger.error(error)
		})
}
//optional parameter - phenotype
//given a phenotype return a list of dataset.

function getDatasets(phenotype){
	var datasetArray = [];
	//then you iterate over this map
	//create a new map - phenotypeDatasetListMap {“phenotype”: [“list of datasets with same phenotype”]}
	//phenotypeDatasetListMap - the phenotype will be the key and its value will be an array with dataset in it.
	//check if the phenotype/value of datasetPhenotypeMap is same as the key of the phenotypeDatasetListMap
	//then append to the datasetArray

	//phenotypeDatasetMap - where key is
	var phenotypeDatasetMap = {};
	var phenotypeDatasetListMap = {};
	//if phenotype is not defined (optional parameter)
	if ( phenotype != undefined ){
		for (item in cache.metadata ){
			for (subitem in cache.metadata [item]){
				Object.keys(cache.metadata [item][subitem]).forEach(key => {
					var sampleGroups = cache.metadata [item][subitem]['sample_groups'];
					for (sampleGroup in sampleGroups){
						Object.keys(sampleGroups[sampleGroup]).forEach(key => {
							let datasetId = sampleGroups[sampleGroup]['id'];
							let phenotypeObj = sampleGroups[sampleGroup]['phenotypes'];
							for(keyWord in phenotypeObj){
								let keys = Object.keys(phenotypeObj[keyWord]);
								let phenotypeName = phenotypeObj[keyWord]['name'];

								if (!!phenotypeDatasetListMap[phenotypeName]) {
									if (phenotypeDatasetListMap[phenotypeName].indexOf(datasetId) < 0) {
										phenotypeDatasetListMap[phenotypeName].push(datasetId);
									}
								}
								else {
									phenotypeDatasetListMap[phenotypeName] = [datasetId];
								}
							}



						});
					}
				})
			}
		}
		//return the value of phenotype which is asked in the parameter
		return phenotypeDatasetListMap[phenotype];
	}
	//given a phenotype
	else{
		for (item in cache.metadata ){
			for (subitem in cache.metadata [item]){
				Object.keys(cache.metadata [item][subitem]).forEach(key => {
					var sampleGroups = cache.metadata [item][subitem]['sample_groups'];
					for (sampleGroup in sampleGroups){
						Object.keys(sampleGroups[sampleGroup]).forEach(key => {

							if (datasetArray.indexOf(sampleGroups[sampleGroup]['id']) < 0){
								datasetArray.push(sampleGroups[sampleGroup]['id']);
							}
						});
					}
				})
			}
		}
		return datasetArray;
	}

}

function getPhenotypes(){
	var phenotypeMap = {};
	//traverse the cachedMetadata and get the phenotypes
	for (item in cache.metadata){
		for (subitem in cache.metadata [item]){
			Object.keys(cache.metadata [item][subitem]).forEach(key => {
				let sampleGroups = cache.metadata [item][subitem]['sample_groups'];
				for (sampleGroup in sampleGroups){
					Object.keys(sampleGroups[sampleGroup]).forEach(key => {
						let phenotypeObj = sampleGroups[sampleGroup]['phenotypes'];
						for(keyWord in phenotypeObj){
							let keys = Object.keys(phenotypeObj[keyWord]);
							let groupName = phenotypeObj[keyWord]['group']; //key
							let phenotypeName = phenotypeObj[keyWord]['name']; // value in a list
							//if key already exist in the map
							if (!!phenotypeMap[groupName]) {
								if (phenotypeMap[groupName].indexOf(phenotypeName) < 0) {
									phenotypeMap[groupName].push(phenotypeName);
								}
							}
							else {
								phenotypeMap[groupName] = [phenotypeName];
							}
						}
					})
				}
			})
		}
	}
	return phenotypeMap;
}

module.exports = {
	getMetadata: getMetadata,
	getPhenotypes: getPhenotypes,
	getDatasets: getDatasets
};
