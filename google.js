const {OAuth2Client} = require('google-auth-library');
const http = require('http');
const url = require('url');
//const opn = require('opn');
//const destroyer = require('server-destroy');
const secrets = require('./secrets');
const secretID = 'google-oauth-portal';

// Download your OAuth2 configuration from the Google
//const keys = require('./google.json');
//const keys = "";

//OAuth keys are now located in AWS Secret Manager
secrets.getSecret(secretID)
    .then((data) => {
        if ('SecretString' in data) {
            //console.log(data.SecretString);
            return data.SecretString;

        } else {
            let buf = new ArrayBuffer(data.SecretBinary, 'base64');
            // decode the secret
            //console.log(buf.toString('ascii'));
            return buf.toString('ascii');
        }
    })
    .then((secrets) => {
        const keys = JSON.parse(secrets);
        return oAuth2Client = new OAuth2Client(keys.client_id, keys.client_secret, `http://localhost:8090${keys.redirect_uri_path}`);
       //return oAuth2Client;
    });

/**
 * Start by acquiring a pre-authenticated oAuth2 client.
 */

// const oAuth2Client = new OAuth2Client(
//     // keys.web.client_id,
//     // keys.web.client_secret,
//     // keys.web.redirect_uris[0]
//
//     keys.client_id, keys.client_secret, keys.redirect_uri
// );

const logInLink = async function (req, res, next) {
    // Generate the url that will be used for the consent dialog.

    //const keys = await secrets.getSecret(secretID).catch(err => (console.log(err)));

    // if(keys)
    //     const oAuth2Client = new OAuth2Client(
    //         keys.client_id, keys.client_secret, keys.redirect_uri
    //     );

    const authorizeUrl = await oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: 'profile email openid',
    });
    //console.log("login link : " + authorizeUrl);
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
    //console.info('Tokens acquired.');

    const tokenInfo = await oAuth2Client.getTokenInfo(
        oAuth2Client.credentials.access_token
    );
    //console.log("token info email: >>> " + tokenInfo.email);
    //console.log("info: " + JSON.stringify(tokenInfo, null, 4));
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

module.exports = {
    logInLink: logInLink,
    oauth2callback: oauth2callback
};
