const express = require('express');
const path = require('path');
const url = require('url');
const app = express();
const util = require('util');
const yaml = require('js-yaml');
const fs = require('fs');
const urlExists = require('url-exists');
const request = require('request');
const metadata = require('./metadata');


//function not used yet
function route_shared_static_content(config) {
	let path = config.content.shared;
	app.get('/shared/:path*', (req, res) => {
		res.redirect(`${path}/${req.path}`);
	});
}

function route_kb_api_requests(config) {
      let host = config.kb.host;
      let port = config.kb.port;
      let expose = config.kb.expose;
      let mdv = config.kb.mdv;
      //REMEMBER TO ENABLE SSL BEFORE GOING LIVE
      let baseurl = "http://" + host + ":" + port;
      let routeNames = Object.keys(expose); //what entry names are exposed?
      routeNames.forEach((name) => {
        let data =  expose[name];
        //build the api link
        let apiPath = baseurl + data.urlpath;
          if (data.method == 'POST') {
              app.post(`/${name}`, (req, res) => {
              });
          }
          else if (data.method == 'GET') {
              app.get(`/${name}*`, (req, res) => {
                     console.log("query", req.query);
                     //REMEMBER - check url exists
                    req.pipe(request({qs:req.query, uri: apiPath, json: true})).pipe(res);
              });
          }
      });
  }

function start(config) {
      route_github_static_content(config);
      route_kb_api_requests(config);
     var promise1 = metadata.getMetadata(config);
     var promise2 = promise1.then(function() {
          app.listen(8090);
        });

  }

function route_github_static_content(config) {
    const resourcePath = config.content.www;
    const checkPath = new URL(resourcePath);

    //static resources are served local instead of github
    if(checkPath.protocol == 'file:') {
        //serve static files from location in the config
        app.use('/www', express.static(url.fileURLToPath(resourcePath)) );

        //serve static files from location relative to where server is run, i.e. public folder
        //app.use('/www', express.static(path.join(__dirname, 'www')) );
    } else {
        app.get('/www/:filePath*', function (req, res) {
            console.log("where");
            let filePath = path + "/" + req.params.filePath;
            //check for error if file doesn't exist
            urlExists(filePath, function(err, exists){
                if (exists){
                    req.pipe(request(filePath)).pipe(res)
                }
                else{
                    res.status(404).send({error: "404: file not found"})
                }
            })
        });
    }
}

//function not used yet
function route_shared_static_content(config) {
    let path = config.content.shared;
    app.get('/shared/:path*', (req, res) => {
        res.redirect(`${path}/${req.path}`);
    });
}

function route_kb_api_requests(config) {
    let host = config.kb.host;
    let port = config.kb.port;
    let expose = config.kb.expose;
    let mdv = config.kb.mdv;
    //REMEMBER TO ENABLE SSL BEFORE GOING LIVE
    let baseurl = "http://" + host + ":" + port;
    let routeNames = Object.keys(expose); //what entry names are exposed?
    routeNames.forEach((name) => {
        let data =  expose[name];
        //build the api link
        let apiPath = baseurl + data.urlpath;
        if (data.method == 'POST') {
            app.post(`/${name}`, (req, res) => {
            });
        }
        else if (data.method == 'GET') {
            app.get(`/${name}*`, (req, res) => {
                console.log("query", req.query);
                //REMEMBER - check url exists
                req.pipe(request({qs:req.query, uri: apiPath, json: true})).pipe(res);
            });
        }

    });

}

app.get("/getDatasets", (req, res) => {
	let dataset = metadata.getDatasets();
	res.json(dataset);
});

app.get("/getPhenotypes", (req, res) => {
	let phenotypes = metadata.getPhenotypes();
	res.json(phenotypes);
});

module.exports = {
    start: start
};
