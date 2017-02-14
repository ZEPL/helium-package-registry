var Promise = require('bluebird')
var RegClient = require('silent-npm-registry-client')
var stream = require('stream')

var removeExtraSquareBracket = require('./../utils/removeExtraSquareBracket')
var setEachVersionInfo = require('./setEachVersionInfo')
var createEachPkgInfoFile = require('./createEachPkgInfoFile')

function getPkgInfoFromNPMRegistry(dependency, uri) {
  var params = { timeout: 1000 }
  var client = new RegClient({logstream: new stream.Writable()})
  client = Promise.promisifyAll(client)

  var finalResult = []

  return client.getAsync(uri, params)
    .then(function (data) {
      var pkgInfo = {}
      pkgInfo[data.name] = setEachVersionInfo(dependency, data)
      finalResult.push(pkgInfo)

      var result = removeExtraSquareBracket(finalResult).replace(/]|[[]/g, '').trim()

      return createEachPkgInfoFile(result, data)
    })
    .catch(function (error) {
      console.error(error.message)
    })
}
module.exports = getPkgInfoFromNPMRegistry