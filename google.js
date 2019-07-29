const {OAuth2Client} = require('google-auth-library');
const url = require('url');
const secretsInfo = require('./secrets');

var shared = {
    configFile: undefined,  //which config file are we using?
    secretID: "",           //get secretID from config file
    pkeys: ""               //parsed keys from aws secrets
};

//shared config file
const useConfig = async function(config) {

    //get secretID from config file
    shared.secretID = config.auth.google.secretId;
    //console.log("id is: " + shared.secretID);
    shared.configFile = config;

    secretsInfo.getSecret(shared.secretID)
        .then(function (data) {
            if ('SecretString' in data) {
                //console.log(data.SecretString);
                //console.log("data: " + JSON.stringify(data, null, 4));
                return data.SecretString;

            } else {
                let buf = new ArrayBuffer(data.SecretBinary, 'base64');
                // decode the secret
                //console.log(buf.toString('ascii'));
                return buf.toString('ascii');
            }
        })
        .then(function (secrets) {
            shared.pkeys = JSON.parse(secrets);
            return shared.pkeys;
        })
        .catch(function (e) {
            return (new Error(e.message))
        });

};

function getAuthenticatedClient(config, keys) {
    return new Promise((resolve, reject) => {
        //console.log("keys: " + JSON.stringify(keys, null, 4));
        let callback = `http://${config.auth.google.callbackHost}${keys.redirect_uri_path}`;
        const oAuth2Client = new OAuth2Client(
            keys.client_id,
            keys.client_secret,
            callback
        );
        resolve(oAuth2Client);
    });
}

//generate login link for auth
const logInLink = async function (req, res, next) {
    // Generate the url that will be used for the consent dialog.

    //create a client object
    let oAuth2Client = await getAuthenticatedClient(shared.configFile, shared.pkeys);
    //generate authorization url
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
    let oAuth2Client = await getAuthenticatedClient(shared.configFile, shared.pkeys);
    // Now that we have the code, use that to acquire tokens.
    const r = await oAuth2Client.getToken(code);
    // Make sure to set the credentials on the OAuth2 client.
    oAuth2Client.setCredentials(r.tokens);
    //console.info('Tokens acquired.');

    const tokenInfo = await oAuth2Client.getTokenInfo(
        oAuth2Client.credentials.access_token
    );

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