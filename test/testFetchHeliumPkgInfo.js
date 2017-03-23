var Promise = require('bluebird')
var npmPkgSearchByDependency = require('npm-pkg-searchby-dependency')
var RegClient = require('silent-npm-registry-client')
var stream = require('stream')
var stringify = require('json-stringify-pretty-compact')

var AWS = require('aws-sdk')
AWS.config.setPromisesDependency(require('bluebird'))

const depList = [
  "zeppelin-vis",
  "zeppelin-spell",
]

var removeExtraSquareBracket = function(jsonArray) {
  jsonArray = jsonArray.map(function(e){
    return stringify(e)
  })

  return jsonArray.join(",")
}

var getPkgInfoFromNPMRegistry = function(dependency, uri) {
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

var setEachVersionInfo = function(dependency, data) {
  var eachVerInfo = {}
  var versions = data.versions
  const defaultIcon = '<i class="fa fa-question-circle"></i>'
  const type = (dependency == "zeppelin-vis") ? "VISUALIZATION" : "SPELL"

  for (var ver in versions) {
    var key = versions[ver]
    // to keep "latest" version tag, use artifact's one
    var verTag = key._id.split('@')[1]

    if (ver == data["dist-tags"].latest) {
      ver = "latest"
    }
    eachVerInfo[ver] = {
      type: type,
      name: key.name,
      version: verTag,
      published: data.time[verTag],
      artifact: key._id,
      author:
        (key.author.name == undefined) && (key.maintainers[0].name == undefined)
          ?
          'unknown'
          :
        key.author.name || key.maintainers[0].name,
      description:
        (key.description == undefined) ? 'unknown' : key.description,
      license:
        (key.license == undefined) ? 'unknown' : key.license,
      icon:
        (key.helium)
          ?
          (key.helium.icon == undefined) ? defaultIcon : key.helium.icon
          :
          (key.icon == undefined) ? defaultIcon : key.icon,
      config:
        (key.helium) ? key.helium.config : undefined,
      spell:
        (key.helium) ? key.helium.spell : undefined
    }
  }
  return eachVerInfo
}

var createEachPkgInfoFile = function(result, data) {
  const bucketName = 'helium-package'
  const folderName = 'packages/'

  console.log(result)
  /*var content = {
    Bucket: bucketName,
    Key: folderName + data.name + '.json',
    Body: result,
    ACL: 'public-read'
  }

  var putObjectPromise = s3.putObject(content).promise()

  putObjectPromise
    .then(function (data) {
      console.log(data)
    })*/
}

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
    /*.delay(7000)
    .then(function () {
      return context.callbackWaitsForEmptyEventLoop = false
    })
    .then(function () {
      return callback(null, "Done")
    })
    .catch(function (error) {
      console.error(error)
      process.exit(-1)
    })*/
  })