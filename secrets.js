//removed the const
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

module.exports = {
    getSecret: getSecret
};
