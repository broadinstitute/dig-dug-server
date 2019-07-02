const server = require('express');



//function not used yet
function route_shared_static_content(config) {
    let path = config.content.shared;

    server.get('/shared/:path*', (req, res) => {
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
    route_github_static_content(config);
    route_kb_api_requests(config);
    //port=config.port
    //server.listen(8090);

    let http = require('http');

    let hostname = '127.0.0.1';
    let port = 8090; //use config.port later

    let server = http.createServer((req, res) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Dig Dug Portal\n');
    });

    server.listen(port, hostname, () => {
        console.log(`Server running at http://${hostname}:${port}/`);
    });
}
