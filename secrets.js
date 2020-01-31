const aws = require('aws-sdk');

// default region to use
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

// get the secret - as JSON - in a promise
async function getSecretJson(secretId) {
    return getSecret(secretId)
        .then(data => {
            if ("SecretString" in data) {
                return data.SecretString;
            } else {
                let buf = new ArrayBuffer(data.SecretBinary, "base64");

                // decode the secret
                return buf.toString("ascii");
            }
        })

        // parse the scret as JSON
        .then(secret => JSON.parse(secret));
}

module.exports = {
    getSecret,
    getSecretJson
};
