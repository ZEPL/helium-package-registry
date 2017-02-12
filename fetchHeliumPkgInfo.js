var Promise = require('bluebird')

var npmPkgSearchByDependency = require('npm-pkg-searchby-dependency')
var getPkgInfoFromNPMRegistry = require('./lib/getPkgInfoFromNPMRegistry')

const depList = [
  "zeppelin-vis",
  "zeppelin-spell",
]

exports.handler = (event, context, callback) => {
  npmPkgSearchByDependency = Promise.promisify(npmPkgSearchByDependency)

  depList.map(function(dependency) {
    var uriList = []

    npmPkgSearchByDependency(dependency)
      .delay(3000)
      .then(function(packages) {
        console.log('\nPackages matching \"' + dependency + '\": (' + packages.length + ')\n')

        uriList = packages.map(function (pkg) {
        return pkg.uri
        })
      })
      .then(function () {
        uriList.map(function (uri) {
          getPkgInfoFromNPMRegistry(dependency, uri)
        })
      })
      .delay(7000)
      .then(function () {
        return context.callbackWaitsForEmptyEventLoop = false
      })
      .then(function () {
        return callback(null, "Done")
      })
      .catch(function (error) {
        console.error(error)
        process.exit(-1)
      })
  })
}