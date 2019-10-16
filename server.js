const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const mime = require("mime");
const url = require("url");
const https = require("https");
const app = express();
const util = require("util");
const yaml = require("js-yaml");
const fs = require("fs");
const request = require("request");
const log4js = require("log4js");

const metadata = require("./metadata");
const google = require("./google");

//configure logger
log4js.configure({
	appenders: {
		out: {
			type: "stdout",
			layout: {
				type: "pattern",
				pattern: "%[[%p] %f{1}:%l >>%] %m"
			}
		}
	},
	categories: {
		default: { appenders: ["out"], level: "all", enableCallStack: true }
	}
});
const logger = log4js.getLogger();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(cookieParser());

/* GET home page. */
app.get("/home", function(req, res, next) {
	let name = req.cookies.name;
	res.render("index", { title: "Dig Dug Portal", name: name });
});

//Google authentication
app.get("/login", google.logInLink);
app.get("/oauth2callback", google.oauth2callback);

//Get datasets
app.get("/kb/getDatasets", (req, res) => {
	let datasets = metadata.getDatasets();
	res.json(datasets);
});

//get datasets w/ given phenotype
app.get("/kb/getDatasets/:phenotype", (req, res) => {
	let datasets = metadata.getDatasets(req.params.phenotype);
	res.json(datasets);
});

//get data for given dataset
// app.use("/kb/getData/:dataset/:phenotype", (req, res) => {
// 	let variants = metadata.getData(req.params.dataset, req.params.phenotype);
// 	res.json(variants);
// });

//Get phenotypes
app.get("/kb/getPhenotypes", (req, res) => {
	let phenotypes = metadata.getPhenotypes();
	res.json(phenotypes);
});

//function not used yet
function route_shared_static_content(config) {
	let path = config.content.shared;
	app.get("/shared/:path*", (req, res) => {
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
	routeNames.forEach(name => {
		let data = expose[name];
		//build the api link
		let apiPath = baseurl + data.urlpath;
		if (data.method == "POST") {
			app.post(`/kb/${name}`, (req, res) => {
				req.pipe(
					request({ qs: req.query, uri: apiPath, json: true })
				).pipe(res);
			});
		} else if (data.method == "GET") {
			app.get(`/kb/${name}*`, (req, res) => {
				console.log("query", req.query);
				//REMEMBER - check url exists
				req.pipe(
					request({ qs: req.query, uri: apiPath, json: true })
				).pipe(res);
			});
		}
	});
}

function route_github_static_content(config, www) {
	const resourcePath = www ? www : config.content.www; //set www to override if passed in
	const checkPath = new URL(resourcePath);

	const charsetOverrides = {
		"application/javascript": "; charset=utf-8",
		"text/css": "; charset=utf-8",
		"text/html": "; charset=utf-8",
		"text/plain": "; charset=utf-8",
		"application/json": "; charset=utf-8"
	};

	//static resources are served local instead of github
	if (checkPath.protocol == "file:") {
		//serve static files from location in the config
		app.use("/", express.static(url.fileURLToPath(resourcePath)));

		//serve static files from location relative to where server is run, i.e. public folder
		//app.use('/www', express.static(path.join(__dirname, 'www')) );
	} else {
		app.get("/*", function(req, res) {
			let content = req.originalUrl.substring(4); //remove mount subdirectory from file path, i.e. /www in this case
			let filePath = resourcePath + content;
			logger.info("getting file: " + filePath);
			req.pipe(
				https.request(filePath, function(newRes) {
					let mimeType = mime.getType(filePath);
					res.setHeader(
						"Content-Type",
						mimeType + (charsetOverrides[mimeType] || "")
					);
					res.setHeader("Cache-Control", "public, max-age=2592000");
					res.setHeader(
						"Expires",
						new Date(Date.now() + 2592000000).toUTCString()
					);

					newRes.pipe(res);
				})
			).on("error", function(err) {
				res.statusCode = 500;
				res.end();
				logger.error(
					new Error("Status 500: couldn't pipe file to client")
				);
			});
		});
	}
}

//start function
function start(config) {
	route_github_static_content(config);
	route_kb_api_requests(config);
	google.useConfig(config);
	logger.info("Getting Metadata, please wait ... ");
	var promise1 = metadata.getMetadata(config);
	var promise2 = promise1.then(function() {
		app.listen(80, () => logger.info("Server started!"));
	});
}

module.exports = {
	start: start
};
