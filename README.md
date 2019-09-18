# Welcome to DIG Portal v.2.0.0.alpha!

This readme file will be updated as needed. The following are currently available features.


## Endpoints
`/login`
Log into the system using a Google account.

`/getMetadata` 
Returns a collection of metadata, in JSON format.

`/getDatasets`
Returns the datasets from the metadata collection, in JSON format.

`/getPhenotypes`
Returns the phenotypes from the metadata collection, in JSON format.

## Config files

Config files are in *yaml* format, and can be loaded at run time. If no config file is selected, the default `config.yml` will be run.

### Selecting a different  config file
```
$ node app --config another_config.yml
```   
Optionally, you can use the shorthand `-c` flag instead of `--config`.

### Overriding static www folder
In addition to selecting a different config file, you can choose to override the static **www** folder for serving assets.  
```
$ node app --config config.yml -www http://linktodomain.com/files
```  
The `--www` flag also comes with its own shorthand `-w`.  

> **Note:** If you want to use serve static files locally, make sure you have the path correctly setup, according on your OS environment. You can change the *www* path in the config file, or override it at runtime, as stated above.

# Requirements

## AWS Secrets

This new portal is currently using [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/) to manage and authorize all credentials, keys and tokens. It is necessary to install and setup before running this web application. Further details and instructions can be found [here](https://github.com/broadinstitute/dig-secrets). 

## Google Authentication

In order to enable login into the portal with a Google account, it is first required to setup a project, acquire the necessary keys and secrets from [Google developer console](https://developers.google.com/identity/sign-in/web/sign-in). Such information is recommended to be saved to AWS Secrets Manager first, and then used when needed through `aws-sdk` API calls.

## Node.js

[Node.js](https://nodejs.org/) is an open-source, cross-platform, JavaScript run-time environment that executes JavaScript code outside of a browser. It is what we're using for our back-end server. More information about installation can be found on its website.

# Running the server
### With default settings
If the requirements have been satisfied, to run the server: 
1. Clone the repo.
2. Using the terminal/command prompt, go to the cloned repo folder.
3. Run the command
```
$ node app
```  
### With custom settings
1. Make the necessary adjustment to the config file, or create a new one
2. Run the command
```
$ node app --config custom_config.yml
```   

