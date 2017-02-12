var removeContentInTmp = require('./lib/removeContentInTmp')
var pushPkgInfoToTmp = require('./lib/pushPkgInfoToTmp')
var getFinalContent = require('./lib/getFinalContent')
var createFinalHeliumFile = require('./lib/createFinalHeliumFile')

// need to check whether Lambda container is being reused or not using its containerID
var containerId = Date.now().toString().slice(-6)

exports.handler = (event, context, callback) => {
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
    .delay(3000)
    .then(function () {
      return context.callbackWaitsForEmptyEventLoop = false
    })
    .then(function () {
      return callback(null, "Done")
    })
    .catch(function (error) {
      console.error(error.message)
    })
}