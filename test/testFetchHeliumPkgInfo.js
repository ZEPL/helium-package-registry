var RegClient = require('silent-npm-registry-client')
var stream = require('stream')
var stringify = require('json-stringify-pretty-compact')
var Promise = require('bluebird')

var npmPkgSearchByDependency = require('npm-pkg-searchby-dependency')

var depList = [
  "zeppelin-vis",
  "zeppelin-spell",
]

function removeExtraSquareBracket(jsonArray) {
  jsonArray = jsonArray.map(function(e){
    return stringify(e);
  });

  return jsonArray.join(",")
}

function setEachVersionInfo (dependency, data) {
  var eachVerInfo = {}
  var versions = data.versions
  const defaultIcon = '<i class="fa fa-question-circle"></i>'
  const type = (dependency == "zeppelin-vis") ? "VISUALIZATION" : "SPELL"

  for (var ver in versions) {
    var key = versions[ver]
    var verTag = key._id.split('@')[1] // to keep "latest" version tag, use artifact's one

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

function getPkgInfo(dependency, uri) {
  var params = { timeout: 1000 }
  var client = new RegClient({logstream: new stream.Writable()})
  client = Promise.promisifyAll(client)

  var finalResult = []

  return client.getAsync(uri, params)
    .then(function (data) {
      var pkgInfo = {}
      pkgInfo[data.name] = setEachVersionInfo(dependency, data)
      finalResult.push(pkgInfo)

      result = removeExtraSquareBracket(finalResult)

      console.log(result)
      return result
    })
    .catch(function (error) {
      console.error(error.message)
    })
}

npmPkgSearchByDependency = Promise.promisify(npmPkgSearchByDependency)

depList.map(function(dependency) {
  var uriList = []

  npmPkgSearchByDependency(dependency)
    .then(function(packages) {
      console.log('\nPackages matching \"' + dependency + '\": (' + packages.length + ')\n')

      uriList = packages.map(function (pkg) {
        return pkg.uri
      })
    })
    .then(function () {
      uriList.map(function (uri) {
        getPkgInfo(dependency, uri)
          .then(function(result) {
            return result
          })
      })
    })
    .catch(function (error) {
      console.error(error)
      process.exit(-1)
    })

})
