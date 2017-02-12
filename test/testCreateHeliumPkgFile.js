var AWS = require('aws-sdk')
// Use bluebird implementation of Promise
AWS.config.setPromisesDependency(require('bluebird'));

var s3 = new AWS.S3(
  {
    signatureVersion: 'v4' // need to convert v2 -> v4 to avoid conflict
  }
)

const bucketName = 'helium-package'
const folderName = 'packages/'
const keyName = 'awesome'
const heliumFileName = 'heliumTmp'

var S3Config = require('s3-append').S3Config
var config = new S3Config({
  "accessKeyId": process.env.AWS_ACCESS_KEY_ID,
  "secretAccessKey": process.env.AWS_SECRET_ACCESS_KEY,
  "region": process.env.AWS_DEFAULT_REGION,
  "bucket": bucketName
})

var S3Append = require('s3-append').S3Append
var Format = require('s3-append').Format
var service = new S3Append(config, keyName, Format.Text)

var lastContent

function createFinalHeliumFile(result) {
  const bucketName = 'helium-package'
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
}

function removeContentInTmp() {
  const bucketName = 'helium-package'
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

function pushPkgInfoToTmp() {
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

function getFinalContent() {

  const bucketName = 'helium-package'
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

removeContentInTmp()
  .delay(3000)
  .then(function(){
    console.log('Will take less than 10 sec to integrate whole package info in ' + containerId + " Lambda container...")
    return pushPkgInfoToTmp()
  })
  .delay(8000)
  .then(function(){
    return getFinalContent()
  })
  .then(function(result){
    return createFinalHeliumFile(result)
  })
  .catch(function (error) {
    console.error(error.message)
  })