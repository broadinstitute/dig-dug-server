# Welcome to DIG Portal - Back-end Server

This is a simplified back-end-only **server** for driving the new knowledge portals. It works in conjunction with 
the [front-end portal](https://github.com/broadinstitute/dig-dug-portal) codes. The separation of services allow each 
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

## AWS Secrets

This new portal framework is currently using [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/) to manage 
and authorize all credentials, keys and tokens. It is necessary to install and set it up before running this web 
application. Further details and instructions can be found [here](https://github.com/broadinstitute/dig-secrets).

## Google Authentication

In order to enable login into the portal with a Google account, it is first required to setup a project, acquire 
the necessary keys and secrets from [Google developer console](https://developers.google.com/identity/sign-in/web/sign-in). 
Such information is recommended to be saved to AWS Secrets Manager first, and then used when needed through `aws-sdk` API calls.

## Node.js and npm

[Node.js](https://nodejs.org/) is an open-source, cross-platform, JavaScript run-time environment that executes 
JavaScript code outside of a browser. It is what we're using for our back-end server and is managed using the 
node package manager `npm`,  which  needs to be installed before building the project.

Information about how to install the node package manager can be found [here](https://www.npmjs.com/get-npm}).

#  Installing and Running the Server

If the above tool and environment prerequisites have been satisfied, to run the server:

1. Clone the repo then go to the cloned repo folder.
2. Install the necessary Javascript module dependencies.
3. Configure the server.
4. Start the server.
5. Access the web interface

Each of these steps is outlined here below.

## 1.Clone the repo then go to the cloned repo folder.

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


### Running the server with a different config file

```sh
$ node app --config another_config.yml
```

Optionally, you can use the shorthand `-c` flag instead of `--config`.

### Overriding static www folder

In addition to selecting a different config file, you can choose to override the static **www** folder for serving assets.

``` sh
$ node app --config config.yml -www http://linktodomain.com/files
```

The `--www` flag also comes with its own shorthand `-w`.

> **Note:** If you want to use serve static files locally, make sure you have the path correctly setup, according on 
>your OS environment. You can change the **www** path in the config file, or override it at runtime, as stated above.

## 5. Access the web interface

Once the server is up and running, you can access the web interface from your browser at:

`http://localhost:8090`

## Endpoints

`/login`
Log into the system using a Google account.

`/kb/getMetadata`
Returns a collection of metadata, in JSON format. \*Note: this is run once before the server started, but can 
be called again as needed.

`/kb/getDatasets`
Returns the datasets from the metadata collection, in JSON format.

`/kb/getPhenotypes`
Returns the phenotypes from the metadata collection, in JSON format.

## Accessing the static resources

[Static resources for the portal](https://github.com/broadinstitute/dig-dug-static-resources), once setup, can be access at:

`http://localhost:8090/www/*`

For example:

`http://localhost:8090/www/manhattan.html`
