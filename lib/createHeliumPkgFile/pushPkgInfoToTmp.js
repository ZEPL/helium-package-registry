var AWS = require('aws-sdk')
AWS.config.setPromisesDependency(require('bluebird'))
var s3 = new AWS.S3(
  {
    signatureVersion: 'v4',
    maxRetries: 0
  }
)

const bucketName = 'helium-package'
const keyName = 'awesome'
const folderName = 'packages/'

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
var service = new S3Append(config, keyName, Format.Text)

function getEachFileContent(file) {
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
module.exports = pushPkgInfoToTmp