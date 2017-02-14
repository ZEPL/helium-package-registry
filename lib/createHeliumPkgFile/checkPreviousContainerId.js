var AWS = require('aws-sdk')
AWS.config.setPromisesDependency(require('bluebird'))
var s3 = new AWS.S3(
  {
    signatureVersion: 'v4',
    maxRetries: 0
  }
)

function checkPreviousContainerId() {
  const bucketName = 'helium-package'
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
module.exports = checkPreviousContainerId