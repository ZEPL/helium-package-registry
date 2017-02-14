var AWS = require('aws-sdk')
AWS.config.setPromisesDependency(require('bluebird'))
var s3 = new AWS.S3(
  {
    signatureVersion: 'v4',
    maxRetries: 0
  }
)

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
module.exports = getFinalContent