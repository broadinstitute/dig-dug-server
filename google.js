const {OAuth2Client} = require('google-auth-library');
const http = require('http');
const url = require('url');
//const opn = require('opn');
//const destroyer = require('server-destroy');
const secretsInfo = require('./secrets');

var configFile = undefined;
var secretID = "";
var oAuth2Client = {};
var pkeys = "";

//const secrets = configSecret(config);
//var oAuth2Client = new OAuth2Client();
//global config file
const useConfig = async function(config) {
    console.log("data1: " + JSON.stringify(config.auth.google, null, 4));
    secretID = config.auth.google.secretId;
    console.log("id is: " + secretID);
    configFile = config;

    secretsInfo.getSecret(secretID)
        .then(function (data) {
            if ('SecretString' in data) {
                //console.log(data.SecretString);
                console.log("data2: " + JSON.stringify(data, null, 4));
                return data.SecretString;

            } else {
                let buf = new ArrayBuffer(data.SecretBinary, 'base64');
                // decode the secret
                //console.log(buf.toString('ascii'));
                return buf.toString('ascii');
            }
        })
        .then(function (secrets) {
            console.log("i'm here");
            pkeys = JSON.parse(secrets);
            console.log("keys1: " + JSON.stringify(pkeys, null, 4));
            oAuth2Client = getAuthenticatedClient(configFile, pkeys);
            console.log("pkeys: " + pkeys);
            return pkeys;
        })
        .catch(function (e) {
            return (new Error(e.message))
        });

};


// Download your OAuth2 configuration from the Google
//const keys = require('./google.json');
//const keys = "";

//console.log(configFile);
//const secretID = configFile.auth.google.secretId;
//const secretID = "google-oauth-portal";

//OAuth keys are now located in AWS Secret Manager

// secretsInfo.getSecret(secretID)
//     .then(function (data) {
//         if ('SecretString' in data) {
//             //console.log(data.SecretString);
//             console.log("data2: " + JSON.stringify(data, null, 4));
//             return data.SecretString;
//
//         } else {
//             let buf = new ArrayBuffer(data.SecretBinary, 'base64');
//             // decode the secret
//             //console.log(buf.toString('ascii'));
//             return buf.toString('ascii');
//         }
//     })
//     .then(function (secrets) {
//         console.log("i'm here");
//         let pkeys = JSON.parse(secrets);
//         //return oAuth2Client = new OAuth2Client(keys.client_id, keys.client_secret, `http://localhost:8090${keys.redirect_uri_path}`);
//         //return oAuth2Client;
//         console.log("keys1: " + JSON.stringify(pkeys, null, 4));
//         oAuth2Client = getAuthenticatedClient(configFile, pkeys);
//         return pkeys;
//     })
//     .catch(function (e) {
//     return (new Error(e.message))
//     });

function getAuthenticatedClient(config, keys) {
    return new Promise((resolve, reject) => {
        console.log("keys: " + JSON.stringify(keys, null, 4));
        let callback = `http://${config.auth.google.callbackHost}${keys.redirect_uri_path}`;
        const oAuth2Client = new OAuth2Client(
            keys.client_id,
            keys.client_secret,
            callback
        );
        resolve(oAuth2Client);
    });
}


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

    //console.log("configfile: " + JSON.stringify(configFile, null, 4));

    let oAuth2Client = await getAuthenticatedClient(configFile, pkeys);

    let authorizeUrl = await oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: 'profile email openid',
    });
    console.log("login link : " + authorizeUrl);
    res.redirect(authorizeUrl);
};

const oauth2callback = function (req, res, next) {
    const uri = `${req.protocol}://${req.headers.host}`;
    const qs = new url.URL(req.url, uri).searchParams;
    let code = qs.get('code');
    //console.log(`Code is ${code}`);
    //console.log("hostname " + uri);
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
    let oAuth2Client = await getAuthenticatedClient(configFile, pkeys);
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
    oauth2callback: oauth2callback,
    useConfig: useConfig
};