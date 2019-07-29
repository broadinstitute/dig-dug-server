const aws = require('aws-sdk');
const secret = 'google-oauth-portal';
const region = 'us-east-1';

// create a client to access secrets
let client = new aws.SecretsManager({
    region: region
});

// get the secret as a promise
function getSecret(secretId) {
    return new Promise((resolve, reject) => {
        client.getSecretValue({ SecretId: secretId }, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

// example usage
// const secrets = getSecret(secret).then((data) => {
//     if ('SecretString' in data) {
//         console.log(data.SecretString);
//         let parsed = JSON.parse(data.SecretString);
//         console.log("parsed" + parsed);
//         console.log("info: " + JSON.stringify(parsed, null, 4));
//         console.log("id: " + parsed.client_id);
//     } else {
//         let buf = new ArrayBuffer(data.SecretBinary, 'base64');
//
//         // decode the secret
//         console.log(buf.toString('ascii'));
//     }
// });

module.exports = {
    getSecret: getSecret
};