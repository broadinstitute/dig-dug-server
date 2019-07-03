const express = require('express');
var app = express();
const util = require('util')
const yaml = require('js-yaml');
const fs = require('fs');

  function route_github_static_content(config) {
    var request = require('request');
      var path = config.content.www;
      app.get('/www/:filePath*', function (req, res) {
      let filePath = path + "/" + req.params.filePath;
      req.pipe(request(filePath)).pipe(res);
      });
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
      let baseurl = "https://" + host + ":" + port;
      let routeNames = Object.keys(expose); //what entry names are exposed?
      routeNames.forEach((name) => {
        let data =  expose[name]
          if (data.method == 'POST') {
              app.post(`/${name}`, (req, res) => {
                  res.redirect(baseurl + data.path);
              });
          } else if (data.method == 'GET') {
              app.get(`/${name}`, (req, res) => {
                  res.redirect(baseurl + data.path);
              });
          }
      });
  }

  function linkProxy(fileName, url){
    var fs = require('fs');
    let fileStream = fs.createWriteStream(fileName);
    request(url).pipe(fileStream);
  }

function start(config) {
      route_github_static_content(config);
      route_kb_api_requests(config);
      app.listen(8090);
  }

  module.exports = {
    start: start
  }
