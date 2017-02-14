var AWS = require('aws-sdk')
AWS.config.setPromisesDependency(require('bluebird'))
var s3 = new AWS.S3(
  {
    signatureVersion: 'v4',
    maxRetries: 3
  }
)

function createEachPkgInfoFile(result, data) {
  const bucketName = 'helium-package'
  const folderName = 'packages/'

  var content = {
    Bucket: bucketName,
    Key: folderName + data.name + '.json',
    Body: result,
    ACL: 'public-read'
  }

  var putObjectPromise = s3.putObject(content).promise()

   putObjectPromise
    .then(function (data) {
      console.log(data)
    })
}
module.exports = createEachPkgInfoFile