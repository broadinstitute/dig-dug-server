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

function getDatasets(){
	var datasetArray = [];
	var datasetNameIdMap = {};
	for (item in cache.metadata ){
		for (subitem in cache.metadata [item]){
			Object.keys(cache.metadata [item][subitem]).forEach(key => {
				var sampleGroups = cache.metadata [item][subitem]['sample_groups'];
				for (sampleGroup in sampleGroups){
					Object.keys(sampleGroups[sampleGroup]).forEach(key => {
						if (datasetArray.indexOf(sampleGroups[sampleGroup]['id']) < 0){
							datasetArray.push(sampleGroups[sampleGroup]['id'])
						}
					});
				}
			})
		}
	}
	return datasetArray;
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
