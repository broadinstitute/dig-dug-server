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
