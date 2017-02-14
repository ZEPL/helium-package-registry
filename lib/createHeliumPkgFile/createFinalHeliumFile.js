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

function createMetadataContent() {
  var currentTime = moment().format('YYYY-MM-DDThh:mm:ssZ')
  var lambdaContainerId = Date.now().toString().slice(-6)

  var metaData = {
    _createdAt: currentTime,
    _lambdaContainerId: lambdaContainerId
  }

  var metaDataJson = {
    metaData: metaData
  }

  return stringify(metaDataJson)
}

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

  var metaDataContent = {
    Bucket: bucketName,
    Key: heliumFileName + '-metadata.json',
    Body: createMetadataContent(),
    ACL: 'public-read'
  }
  var putObjectPromiseForMetaData = s3.putObject(metaDataContent).promise()

  putObjectPromiseForMetaData
    .then(function (data) {
      //console.log(data)
    })
}
module.exports = createFinalHeliumFile