const {OAuth2Client} = require('google-auth-library');
const http = require('http');
const url = require('url');
const opn = require('opn');
const destroyer = require('server-destroy');

// Download your OAuth2 configuration from the Google
const keys = require('./google.json');

/**
 * Start by acquiring a pre-authenticated oAuth2 client.
 */
async function main() {
    const oAuth2Client = await getAuthenticatedClient();
    // Make a simple request to the People API using our pre-authenticated client. The `request()` method
    // takes an GaxiosOptions object.  Visit https://github.com/JustinBeckwith/gaxios.
    const url = 'https://people.googleapis.com/v1/people/me?personFields=names';
    const res = await oAuth2Client.request({url});
    console.log(res.data);

    // After acquiring an access_token, you may want to check on the audience, expiration,
    // or original scopes requested.  You can do that with the `getTokenInfo` method.
    const tokenInfo = await oAuth2Client.getTokenInfo(
        oAuth2Client.credentials.access_token
    );
    console.log("token info email: >>> " + tokenInfo);
    //console.log("hey: " + JSON.stringify(tokenInfo, null, 4));
}

const oAuth2Client = new OAuth2Client(
    keys.web.client_id,
    keys.web.client_secret,
    keys.web.redirect_uris[0]
);

const logInLink = function (req, res, next) {
    // Generate the url that will be used for the consent dialog.
    const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: 'profile email openid',
    });
    console.log("login link : " + authorizeUrl);
    res.redirect(authorizeUrl);
};

const oauth2callback = async function (req, res, next) {
    const qs = new url.URL(req.url, 'http://localhost:8090').searchParams;
    let code = qs.get('code');
    //console.log(`Code is ${code}`);
    if (!code) {
        next(new Error('No code provided'));
    } else {
        getInfo(code)
            .then(function (data) {
                //console.log("data: " + JSON.stringify(data, null, 4));
                res.cookie('email', data.email);
                res.cookie('name', data.name);
                res.redirect('/'); //redirect home
            })
            .catch(function (e) {
                next(new Error(e.message))
            })
    }
};

const getInfo = async function (code) {
    // Now that we have the code, use that to acquire tokens.
    const r = await oAuth2Client.getToken(code);
    // Make sure to set the credentials on the OAuth2 client.
    oAuth2Client.setCredentials(r.tokens);
    console.info('Tokens acquired.');

    const tokenInfo = await oAuth2Client.getTokenInfo(
        oAuth2Client.credentials.access_token
    );
    //console.log("token info email: >>> " + tokenInfo.email);
    console.log("info: " + JSON.stringify(tokenInfo, null, 4));
    //return tokenInfo;

    const url = 'https://people.googleapis.com/v1/people/me?personFields=names';
    const res = await oAuth2Client.request({url});

   //console.log(res.data);
   let user = {};
   user.email = tokenInfo.email;
   //console.log("data: " + JSON.stringify(res.data, null, 4));
   user.name = res.data.names[0].displayName; //name is inside an array object

   //console.log("user: " + user.name);

   return user;
};

/**
 * Create a new OAuth2Client, and go through the OAuth2 content
 * workflow.  Return the full client to the callback.
 */
function getAuthenticatedClient() {
    return new Promise((resolve, reject) => {
        // create an oAuth client to authorize the API call.  Secrets are kept in a `keys.json` file,
        // which should be downloaded from the Google Developers Console.
        const oAuth2Client = new OAuth2Client(
            keys.web.client_id,
            keys.web.client_secret,
            keys.web.redirect_uris[0]
        );

        // Generate the url that will be used for the consent dialog.
        const authorizeUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        });
        console.log("here: " + authorizeUrl);
        // Open an http server to accept the oauth callback. In this simple example, the
        // only request to our webserver is to /oauth2callback?code=<code>
        const server = http
            .createServer(async (req, res) => {
                try {
                    if (req.url.indexOf('/oauth2callback') > -1) {
                        // acquire the code from the querystring, and close the web server.
                        const qs = new url.URL(req.url, 'http://localhost:8090')
                            .searchParams;
                        const code = qs.get('code');
                        console.log(`Code is ${code}`);
                        res.end('Authentication successful! Please return to the console.');
                        server.destroy();

                        // Now that we have the code, use that to acquire tokens.
                        const r = await oAuth2Client.getToken(code);
                        // Make sure to set the credentials on the OAuth2 client.
                        oAuth2Client.setCredentials(r.tokens);
                        console.info('Tokens acquired.');
                        resolve(oAuth2Client);
                    }
                } catch (e) {
                    reject(e);
                }
            })
            .listen(3000, () => {
                // open the browser to the authorize url to start the workflow
                //console.log(authorizeUrl);
                opn(authorizeUrl, {wait: false}).then(cp => cp.unref());
            });
        destroyer(server);
    });
}

//main().catch(console.error);

module.exports = {
    logInLink: logInLink,
    oauth2callback: oauth2callback
};
