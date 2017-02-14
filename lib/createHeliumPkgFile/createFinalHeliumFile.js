var AWS = require('aws-sdk')
AWS.config.setPromisesDependency(require('bluebird'))
var s3 = new AWS.S3(
  {
    signatureVersion: 'v4',
    maxRetries: 0
  }
)

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
module.exports = createFinalHeliumFile