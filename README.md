# Welcome to DIG Portal - Back-end Server

This is a simplified back-end-only **server** for driving the new knowledge portals. It works in conjunction with the
  [front-end portal](https://github.com/broadinstitute/dig-dug-portal) codes. The separation of services allow each
  part to function independently, and allow for greater flexibility. I.e. designers can concentrate on the front-end
   works without needing to know the back-end codes.

---

This readme file will be updated as needed. The following are currently available features.

# Overview of the Server

- Configurations are loaded from a file
- Serves 100% static content (html, js, css, images, etc ...)
- Gets all static content from a configured location (Github, S3, ...)
- Acts as a router for exposed KB end-points (as defined in the config file)

# Prerequisites

Before installing, building and running a fully operational server, some basic authentication and build tools need to
  be installed and configured.

## Google Authentication

In order to enable login into the portal with a Google account, it is first required to setup a project, acquire the 
necessary keys and secrets from [Google developer console](https://developers.google.com/identity/sign-in/web/sign-in). 
Such information is recommended to be saved to AWS Secrets Manager first, and then used when needed through `aws-sdk` 
API calls.

Note that when you [set up the Google Oauth2 project](https://developers.google.com/identity/sign-in/web/sign-in), 
you need to invoke the *Configure a project* wizard to specify some details, as follows:

* Create a Google API Console Project:
    * Give the title of the project (can be any meaningful name for your portal project)
* Configure your OAuth client:
    * Where you are calling Oauth2 from:  select *Web Server*
    * Authorized redirect URIs:  provide a URI consisting of a `oauth2callback` appended to a URL composed of  
      your http protocol prefixed to your callback hostname  (i.e. value  from the server `config.yml` file
       under the `auth: google:  callbackHost:` tag, e.g. localhost:8090), e.g.: `http://localhost:8090/oauth2callback`

Both a Google API Console project *client_id* and *client_secret* are then assigned. You should securely save them on
  your computer in preparation for securing them with AWS Secrets (below) for secure indirect access by the server.
  
After creating the project, the [Google People API](https://console.developers.google.com/apis/api/people
.googleapis.com) also needs to be enabled for the proper operation of the proper operation of the Google Oauth2 mediated
 login process.

After access to the AWS Secrets manager is configured (below), then the following Google API secret tag values need to 
 be recorded under the `auth: google: secretId:` name found in the server `config.yml` file (e.g. **google-oauth
 -portal**):

* _redirect_uri_path_: this value should generally be **/oauth2callback**
* _client_id_: the **client id** obtained from the Google API project registration process above
* _client_secret_: the **client secret** obtained from the Google API project registration process above

The AWS Secret Manager Console **secret type** _Other type of secret_ can be selected to input the above values.

## MySQL Database Configuration

The server uses MySQL to store information. The database credentials are also assumed stored in AWS Secrets.

After access to the AWS Secrets manager is configured (below), then the following MySQL key values need to be
  recorded in AWS Secrets under the `logins:` name found in the server `config.yml` file (e.g. **dig-dug-logins**):

* host
* port
* username
* password
* dbname

Select the AWS Secret Manager Console **secret type** _Credentials for other database_ to facilitate secret input. 
The values of these tags are, of course, those site specific values set in the MySQL instance accessed by the server.

## AWS Secrets Manager

This new portal framework is currently using [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/) to manage
  and authorize all credentials, keys and tokens (such as the Google API secrets noted above). It is necessary to
    install and set it up before, then manually save the necessary project secrets, before running the server application. 

Further details and instructions on how to set up AWS Secrets is [here](https://github.com/broadinstitute/dig-secrets).

The simplest way to record the Google API and database (and other) project secrets in the AWS Secrets is through the
 [AWS Secrets Manager Console](https://console.aws.amazon.com/secretsmanager/home?region=us-east-1#/newSecret?step
 =selectSecret)  selecting the "Other Secrets" storage option. 

AWS Secrets are indexed under a "Secret Name". A slight source of confusion is that the AWS API uses the input
**secretId**  instead of "secretName". In fact, the 'secret name' and 'secretId' are effectively the same parameter.  
 Thus, the secret key values registered should be the corresponding names noted above (i.e. **google-oauth-portal** 
 and **dig-dug-logins**). The various key and values are then recorded individually under the secret name. Note that 
 the AWS Secrets **DefaultEncryptionKey** can be used as is for the secret value encryption. 

## Node.js and npm

[Node.js](https://nodejs.org/) is an open-source, cross-platform, JavaScript run-time environment that executes
 JavaScript code outside of a browser. It is what we're using for our back-end server and is managed using the node
  package manager `npm`,  which  needs to be installed before building the project.

Information about how to install the node package manager can be found [here](https://www.npmjs.com/get-npm}).

#  Installing and Running the Server

If the above tool and environment prerequisites have been satisfied, to run the server:

1. Clone the repo then go to the cloned repo folder.
2. Install the necessary Javascript module dependencies.
3. Configure the server.
4. Start the server.
5. Access the web interface

Each of these steps is outlined here below.

## 1. Clone the repo then go to the cloned repo folder.

```sh 
git clone https://github.com/broadinstitute/dig-dug-server.git
cd dig-dug-server
```

## 2. Install the necessary Javascript module dependencies.

To install the project's Javascript module dependencies, from within dig-dug-server project root folder, type:

```sh
npm install
```

You may initially get some errors of the form:

```  
npm WARN <some-package> requires a peer of <some-other-package> but none is installed. You must install peer dependencies yourself.
```

This issue is generally resolved by installing the *<some-other-package>* independently as follows:

``` 
npm install --save-dev <some-other-package>
```

### Special Note to Mac OSX Developers

Before installing the above npm dependencies on MacOSX, you may need to ensure that `node-gyp` is properly configured. 
See [here](https://www.npmjs.com/package/node-gyp) for details. Note: if your Mac OSX is the Catalina release, 
see [the special note on properly configuring Catalina][https://github.com/nodejs/node-gyp/blob/HEAD/macOS_Catalina.md).  

## 3. Configure the server.

A  default `config.yml` yaml file in the project documents site-specific server parameters, which may be customized 
(see below). In particular, the `content: dist:` tag value should point to the local front-end portal code folder of 
the site. The default `config.yml` file points to a local peer folder with the `dig-dug-portal`  distribution. This  
`config.yml` file may be copied then customized to local site needs and file layouts then used to start the server.

## 4. Start the server.

To run the server using the default configuration, within the *dig-dug-server* folder, type:
 
```sh
node app
```

The web site should now be visible in your local web browser at the configuration `callbackHost:` specified URL, i.e.
[http://localhost:8090](http://localhost:8090)`


### Overriding the Default Configuration Settings

An optional configuration file can be given at server start-up. Values specified in that file will override their 
equivalent tags in the default `config.yml` file.

```sh
$ node app --config override_config.yml
```

Optionally, you can use the shorthand `-c` flag instead of `--config`.

## 5. Access the web interface

Once the server is up and running, you can access the web interface from your browser at:

`http://localhost:8090`

## Special Endpoints

`/login`
Log into the system using a Google account.

## Accessing the static resources

[Static resources for the portal](https://github.com/broadinstitute/dig-dug-static-resources), once setup, can be access at:

`http://localhost:8090/www/*`

For example:

`http://localhost:8090/www/manhattan.html`
