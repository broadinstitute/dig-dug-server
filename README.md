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

### Overwriting static www folder
In addition to selecting a different config file, you can choose to overwriting the static **www** folder for serving assets.  
```
$ node app --config config.yml -www http://linktodomain.com/files
```  
The `--www` flag also comes with its own shorthand `-w`.

# Requirements

## AWS Secrets

This new portal is currently using [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/) to manage and authorize all credentials, keys and tokens. It is necessary to install and setup before running this web application. Further details and instructions can be found [here](https://github.com/broadinstitute/dig-secrets). 

## Google Authentication

In order to enable login into the portal with a Google account, it is first required to setup a project, acquire the necessary keys and secrets from [Google developer console](https://developers.google.com/identity/sign-in/web/sign-in). Such information is recommended to be saved to AWS Secrets Manager first, and then used when needed through `aws-sdk` API calls.
