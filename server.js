const express = require('express');
var app = express();
const util = require('util')
const yaml = require('js-yaml');
const fs = require('fs');
const urlExists = require('url-exists');
const request = require('request');
const metadata = require('./metadata');

  function route_github_static_content(config) {
    var path = config.content.www;
    app.get('/www/:filePath*', function (req, res) {
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

  //function not used yet
  function route_shared_static_content(config) {
      let path = config.content.shared;
      app.get('/shared/:path*', (req, res) => {
          res.redirect(`${path}/${req.path}`);
      });
  }

  //http://ec2-34-229-106-174.compute-1.amazonaws.com:8090/dccservices/getMetadata?mdv=mdv140

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
      //  console.log(name);
        //build the api link
        let apiPath = baseurl + data.urlpath;
        //console.log(apiPath);
          if (data.method == 'POST') {
              app.post(`/${name}`, (req, res) => {
                // urlExists(apiPath, function(err, exists){
                //    if (exists){
                //        req.pipe(request(apiPath)).pipe(res);
                //    }
                //    else{
                //        res.status(404).send({error: "404: file not found"})
                //    }
                //  }

                //  res.redirect(baseurl + data.path);
              }); //app.post
          } //if close
          else if (data.method == 'GET') {
              app.get(`/${name}*`, (req, res) => {
                     console.log("query", req.query);
                     //REMEMBER - check url exists
                    req.pipe(request({qs:req.query, uri: apiPath, json: true})).pipe(res);
              }); //app.get
          } //else if

      }); //routeNames close

  }


  // function linkProxy(fileName, url){
  //   var fs = require('fs');
  //   let fileStream = fs.createWriteStream(fileName);
  //   request(url).pipe(fileStream);
  // }




function start(config) {
      route_github_static_content(config);
      route_kb_api_requests(config);

          let host = config.kb.host;
          let port = config.kb.port;
          let mdv = config.kb.mdv;
          //make the call to getMetadata and cache
          metadata.getMetadata(host, port, mdv);
          //console.log(promise);
          //const promise2 = promise.then(cacheMetadata.getPhenotype());
          metadata.getPhenotypes();


         app.listen(8090);




  }

  module.exports = {
    start: start
  };
