var AWS = require('aws-sdk')
AWS.config.setPromisesDependency(require('bluebird'))
var s3 = new AWS.S3(
  {
    signatureVersion: 'v4',
    maxRetries: 0
  }
)

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
module.exports = removeContentInTmp