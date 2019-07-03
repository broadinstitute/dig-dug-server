const express = require('express');
var app = express();
const util = require('util')
const yaml = require('js-yaml');
const fs = require('fs');

  function route_github_static_content(config) {
      var path = config.content.www;
      app.get('/www/:path*', function (req, res) {
        res.redirect(`${path}/${req.params.path}`);
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
      let routeNames = Object.keys(expose); //what entry names are exposed?

      routeNames.forEach((name, data) => {
          if (data.method == 'POST') {
              server.post(`/${name}`, (req, res) => {
                  res.redirect(data.path);
              });
          } else if (data.method == 'GET') {
              server.get(`/${name}`, (req, res) => {
                  res.redirect(data.path);
              });
          }
      });
  }

function start(config) {
      util.inspect(config);
      route_github_static_content(config);
      route_kb_api_requests(config);
      app.listen(8090);
  }

  module.exports = {
    start: start
  }
