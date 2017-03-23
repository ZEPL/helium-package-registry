# helium-package-registry

<img src="./img/logo.png" width="320px" />

This repository contains 
 - [fetchHeliumPkgInfo](https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/fetchHeliumPkgInfo)
 - [createHeliumPkgFile](https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/createHeliumPkgFile)
 - [getMavenArtifactInfo](https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/getMavenArtifactInfo)
 
[AWS Lambda functions](https://aws.amazon.com/lambda/)) source code. The overall workflow is described in [Helium Online Repository - Work Flow GSlide](https://docs.google.com/a/zepl.com/presentation/d/1xUArdKJQAQFNbr7Atpgt-9waSm75IxgrmjLnh-UHYeo/edit?usp=sharing).

### What are these function for?
Using [npm-pkg-searchby-dependency](https://www.npmjs.com/package/npm-pkg-searchby-dependency), filter npm packages that have `zeppelin-vis`(for VISUALIZATION type pkg) or `zeppelin-spell`(for SPELL type pkg) as its dependency from [npm registry](http://registry.npmjs.org/).

> This filtering condition can be expanded whenever new Helium package type is added.

Then will extact only Zeppelin-needed fields(`type`, `name`, `description`, `artifact`, `license`, `icon` and etc etc..) from each package's `package.json` file for every versions, 
and create new json array like below. 
```
[{
  "helium_viz_package_name1": {
    "0.0.1": {
      "type": "VISUALIZATION",
      "name": "helium_viz_package_name",
      "author": "anonymous",
      "description": "package description",
      "artifact": "helium_viz_package_name@version",
      "license": "Apache-2.0",
      "icon": "package icon"
    },
    "0.0.2":{
    ...
    },
    ... 
    "latest": {
    ...
    }
  },
  "helium_viz_package_name2": {
    "0.0.1": {
      "type": "SPELL",
      "name": "helium_viz_package_name",
      "artifact": "helium_viz_package_name@1.0.4",
      "author": "anonymous",
      "description": "package description",
      "license": "Apache-2.0",
      "icon": "package icon"
      "config": {
        "config_name": {
          ...
        }
      },
      "spell": {"magic": "%magic", "usage": "pkg usage"}
    },
    ... 
    "latest": {
    ...
    }
  },
  ...
}]
```

#### Setup
Install [node-lambda](https://github.com/motdotla/node-lambda) under `helium-package-registry/` and setup the local env to connect with your AWS account.
```
$ (sudo) npm install node-lambda
$ node-lambda setup
```

This command will create `event.json`, `context.json`, `.env` files, and `deploy.env`. For more about these files role, see [node-lambda#setup](https://github.com/motdotla/node-lambda#setup).
Nothing much need to be modified. But for `event.json`, use provided one. And modify below env variables in `.env`. 
```
AWS_ROLE_ARN="your_role"
AWS_REGION=us-east-1
AWS_TIMEOUT=25

# 1. For fetchHeliumPkgInfo function
AWS_HANDLER=lib/fetchHeliumPkgInfo.handler
AWS_FUNCTION_NAME=fetchHeliumPkgInfo

# 2. For createHeliumPkgFile function
# AWS_HANDLER=lib/createHeliumPkgFile.handler
# AWS_FUNCTION_NAME=createHeliumPkgFile

# 3. For getMavenArtifactInfo function
AWS_HANDLER=lib/getMavenArtifactInfo.handler
AWS_FUNCTION_NAME=getMavenArtifactInfo
```
That's it.

#### Run
There are 2 Lambda functions in this repository. One is `fetchHeliumPkgInfo` and the other is `createHeliumPkgFile`.

**1.** Run fetchHeliumPkgInfo function
To run fetchHeliumPkgInfo in `lib/fetchHeliumPkgInfo.js`, comment out below variables in `.env`

```
AWS_HANDLER=lib/fetchHeliumPkgInfo.handler
AWS_FUNCTION_NAME=fetchHeliumPkgInfo
```

and comment another handler functions (createHeliumPkgFile & getMavenArtifactInfo)


**2.** Run createHeliumPkgFile function
To run createHeliumPkgFile in `lib/createHeliumPkgFile.js`, comment out below variables in `.env`

```
AWS_HANDLER=lib/createHeliumPkgFile.handler
AWS_FUNCTION_NAME=createHeliumPkgFile
```

and comment another handler functions (fetchHeliumPkgInfo & getMavenArtifactInfo)


**3.** Run getMavenArtifactInfo function
To run getMavenArtifactInfo in `lib/getMavenArtifactInfo.js`, comment out below variables in `.env`

```
AWS_HANDLER=lib/getMavenArtifactInfo.handler
AWS_FUNCTION_NAME=getMavenArtifactInfo
```

and comment another handler functions (fetchHeliumPkgInfo & createHeliumPkgFile)

and in your CLI 
```
$ node-lambda run
```

`fetchHeliumPkgInfo` will create each package info file under `packages` in S3 buckect: [`helium-package`](https://console.aws.amazon.com/s3/home?region=us-east-1#&bucket=helium-package). And `createHeliumPkgFile` will create `helium.json` & `helium.js` under S3 buckect: [`helium-package`](https://console.aws.amazon.com/s3/home?region=us-east-1#&bucket=helium-package).

> `awesome` file is just tmp file for JSON formatting

#### Build and packaging
To make the build result as `.zip` file,
```
$ node-lambda package
```
the above command will create `build/` and place the `.zip` file under the dir. 

#### Deploy updated Lambda function to AWS
To deploy the packaged zip file to AWS, you need to fill `deploy.env` first. 
```
AWS_ACCESS_KEY_ID="your_access_key"
AWS_SECRET_ACCESS_KEY="your_access_secret_key"
AWS_DEFAULT_REGION="us-east-1"
AWS_ROLE="your_role"
```
then run
```
$ node-lambda deploy
```
Check "Last modified" time in AWS Lambda console just for sure :)
