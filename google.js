const { OAuth2Client } = require("google-auth-library");
const url = require("url");
const log4js = require("log4js");

const secretsInfo = require("./secrets");
const logins = require("./logins");

//set logger level
const logger = log4js.getLogger();
logger.level = "all";

var shared = {
    configFile: undefined, //which config file are we using?
    secretID: "", //get secretID from config file
    pkeys: "" //parsed keys from aws secrets
};

//shared config file
const useConfig = async function(config) {
    //get secretID from config file
    shared.secretID = config.auth.google.secretId;
    shared.configFile = config;

    secretsInfo
        .getSecret(shared.secretID)
        .then(function(data) {
            if ("SecretString" in data) {
                //logger.debug("secret data: " + JSON.stringify(data, null, 4));
                return data.SecretString;
            } else {
                let buf = new ArrayBuffer(data.SecretBinary, "base64");
                // decode the secret
                return buf.toString("ascii");
            }
        })
        .then(function(secrets) {
            shared.pkeys = JSON.parse(secrets);
            return shared.pkeys;
        })
        .catch(function(e) {
            return new Error(e.message);
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
const logInLink = async function(req, res, next) {
    // Generate the url that will be used for the consent dialog.

    //create a client object
    let oAuth2Client = await getAuthenticatedClient(
        shared.configFile,
        shared.pkeys
    );

    //generate authorization url
    let authorizeUrl = await oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: "profile email openid"
    });
    logger.info("login link : " + authorizeUrl);
    res.redirect(authorizeUrl);
};

const oauth2callback = function(req, res, next) {
    const uri = `${req.protocol}://${req.headers.host}`;
    const qs = new url.URL(req.url, uri).searchParams;
    let code = qs.get("code");

    if (!code) {
        next(new Error("No code provided"));
    } else {
        getUserInfo(code)
            // Not saving info to DB for now, just set session cookie
            // .then(user =>
            //     logins.createSession(user.email, user.name, user.access_token)
            // )
            .then(session => {
                res.cookie(logins.cookieName, session.access_token, {
                    domain: req.hostname //require explicit domain set to work with subdomains
                });
                res.redirect(req.cookies.whereAmI || "/"); //redirect back or home
            })
            .catch(function(e) {
                next(new Error(e.message));
            });
    }
};

const getUserInfo = async function(code) {
    let oAuth2Client = await getAuthenticatedClient(
        shared.configFile,
        shared.pkeys
    );
    // Now that we have the code, use that to acquire tokens.
    const r = await oAuth2Client.getToken(code);
    // Make sure to set the credentials on the OAuth2 client.
    oAuth2Client.setCredentials(r.tokens);
    //console.info('Tokens acquired.');

    const tokenInfo = await oAuth2Client.getTokenInfo(
        oAuth2Client.credentials.access_token
    );

    const url = "https://people.googleapis.com/v1/people/me?personFields=names";
    const res = await oAuth2Client.request({ url });

    let user = {};
    user.email = tokenInfo.email;
    user.name = res.data.names[0].displayName; //name is inside an array object
    user.access_token = oAuth2Client.credentials.access_token;

    return user;
};

module.exports = {
    logInLink,
    oauth2callback,
    useConfig,
    getUserInfo
};
