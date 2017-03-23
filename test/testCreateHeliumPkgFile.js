var AWS = require('aws-sdk')
AWS.config.setPromisesDependency(require('bluebird'))
var s3 = new AWS.S3(
  {
    signatureVersion: 'v4',
    maxRetries: 0
  }
)

var moment = require('moment')
var stringify = require('json-stringify-pretty-compact')

const bucketName = 'helium-package'

var checkPreviousContainerId = function() {
  const keyName = 'helium-metadata.json'

  const params = {
    Bucket: bucketName,
    Key: keyName
  }
  var getObjectPromise = s3.getObject(params).promise()

  return getObjectPromise
    .then(function(data) {
      var content = data.Body.toString()
      var previousContainerId = JSON.parse(content).metaData._lambdaContainerId

      return previousContainerId
    })
    .catch(function (error) {
      console.log(error, error.stack)
    })
}


var removeContentInTmp = function() {
  const keyName = 'awesome'

  var content = {
    Bucket: bucketName,
    Key: keyName,
    Body: ''
  }
  var putObjectPromise = s3.putObject(content).promise()

  return putObjectPromise
    .then(function () {
      console.log('Remove tmp file...')
    })
}

var S3Config = require('s3-append').S3Config
var config = new S3Config({
  "accessKeyId": process.env.AAKID,
  "secretAccessKey": process.env.ASAK,
  "region": process.env.AR,
  "bucket": bucketName
})

// Using config from above
var S3Append = require('s3-append').S3Append
var Format = require('s3-append').Format
var service = new S3Append(config, 'awesome', Format.Text)

var getEachFileContent = function(file) {
  const folderName = 'packages/'
  const params = {
    Bucket: bucketName,
    Key: folderName + file
  }
  var getObjectPromise  = s3.getObject(params).promise()

  return getObjectPromise
    .then(function(data) {

      var content = data.Body.toString()
      content = content.substring(1, content.length-1).trim().replace(/]|[[]/g, '')

      return content
    })
    .catch(function (error) {
      console.log(error, error.stack)
    })
}

var pushPkgInfoToTmp = function() {
  const folderName = 'packages/'
  const params = {
    Bucket: bucketName,
    Marker: folderName
  }
  var listObjectsPromise = s3.listObjects(params).promise()

  return listObjectsPromise
    .then(function (data) {
      for (var idx in data.Contents) {
        var fileName = data.Contents[idx].Key.replace(folderName, '')
        getEachFileContent(fileName)
          .then(function(content) {
            service.append(content + ',')
              .then(function () {
                service.flush()
              })
              .catch(function (error) {
                console.error(error.message)
              })
          })
      }
    })
}

var getFinalContent = function() {
  const keyName = 'awesome'

  const params = {
    Bucket: bucketName,
    Key: keyName
  }
  var getObjectPromise = s3.getObject(params).promise()

  return getObjectPromise
    .then(function(data) {
      console.log(data)
      var content = data.Body.toString()
      content = content.trim().slice(0, -1)

      return lastContent = '[{' + content + '}]'
    })
    .catch(function (error) {
      console.log(error, error.stack)
    })
}

var createMetadataContent = function(containerId) {
  var currentTime = moment().format('YYYY-MM-DDThh:mm:ssZ')

  var metaData = {
    _createdAt: currentTime,
    _lambdaContainerId: containerId
  }

  var metaDataJson = {
    metaData: metaData
  }

  return stringify(metaDataJson)
}

var createFinalHeliumFile = function(containerId, result) {
  const heliumFileName = 'helium'

  var content = {
    Bucket: bucketName,
    Key: heliumFileName + '.json',
    Body: result,
    ACL: 'public-read'
  }
  var putObjectPromise = s3.putObject(content).promise()

  putObjectPromise
    .then(function (data) {
      //console.log(data)
    })

  var fakeJsVariableName = 'var zeppelinHeliumPackages = '
  var jsContent = {
    Bucket: bucketName,
    Key: heliumFileName + '.js',
    Body: fakeJsVariableName + result,
    ACL: 'public-read'
  }
  var putObjectPromiseForJs = s3.putObject(jsContent).promise()

  putObjectPromiseForJs
    .then(function (data) {
      //console.log(data)
    })
    .catch(function (error) {
      console.error(error.message)
    })

  var metaDataContent = {
    Bucket: bucketName,
    Key: heliumFileName + '-metadata.json',
    Body: createMetadataContent(containerId),
    ACL: 'public-read'
  }
  var putObjectPromiseForMetaData = s3.putObject(metaDataContent).promise()

  putObjectPromiseForMetaData
    .then(function (data) {
      //console.log(data)
    })
}

// need to check whether Lambda container is being reused or not using its containerID
var containerId = Date.now().toString().slice(-6)

checkPreviousContainerId()
  .then(function (previousContainerId) {
    console.log("Running at Lambda container " + containerId)
    if(previousContainerId !== containerId) {
      return removeContentInTmp()
    } else {
      context.callbackWaitsForEmptyEventLoop = false
      return callback(null, "Abort function running to prevent to create duplicated key.")
    }
  })
  .delay(3000)
  .then(function(){
    console.log("Will take less than 10 sec to integrate whole package info ...")
    return pushPkgInfoToTmp()
  })
  .delay(8000)
  .then(function(){
    return getFinalContent()
  })
  .then(function(result){
    return createFinalHeliumFile(containerId, result)
  })
  /*.delay(3000)
  .then(function () {
    return context.callbackWaitsForEmptyEventLoop = false
  })
  .then(function () {
    return callback(null, "Done")
  })*/
  .catch(function (error) {
    console.error(error.message)
  })