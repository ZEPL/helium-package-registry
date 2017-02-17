var _ = require("underscore")
var rp = require('request-promise')
var moment = require('moment')
var Promise = require('bluebird')
var xml2js = Promise.promisifyAll(require('xml2js'))
var stringify = require('json-stringify-pretty-compact')

var zeppelinList = []
var pomUriList = []
var responseList = []
var bodyList = []
var finalArtifactList = []

function filterLessThanOneYear(standard) {
  var duration = moment.duration({'year' : 1})
  var oneYearAgo = moment().subtract(duration).format()

  // filter only artifacts created within 1 year from now
  return moment(standard).isAfter(oneYearAgo)
}

function searchOnlyZeppelinRelatedArtifact(uri) {
  var options = {
    uri: uri,
    json: true
  }

  return rp(options)
    .then(function (result) {
      var body = result.response.docs

      for (artifact in body) {
        var artifactId = body[artifact].a
        var groupId = body[artifact].g
        var published = body[artifact].timestamp
        published = moment(published).format()

        if (filterLessThanOneYear(published)) {
          zeppelinList.push({
            groupId,
            artifactId
          })
        }
      }
      return zeppelinList
    })
}

function createSlashedGroupId(groupId) {
  var slashedGroupId = ""

  for (id in groupId) {
    var text = groupId[id] + '/'
    slashedGroupId = slashedGroupId.concat(text)
  }

  return slashedGroupId
}

function createPomUrl(groupId, artifactId, version) {
  var baseUri = 'http://repo1.maven.org/maven2/'
  var slashedGroupId = createSlashedGroupId(groupId)

  if (slashedGroupId) {
    var uri = baseUri + slashedGroupId + artifactId + '/' + version + '/'
    var pomUri = uri + artifactId + '-' + version + '.pom'
  }

  return pomUri
}

function getAllVersionInfo(zeppelinList) {
  // get all version of an artifact
  return _.map(zeppelinList, function(resources) {
    var baseUri =
      'http://search.maven.org/solrsearch/select?q=g:%22'
      + resources.groupId + '%22+AND+a:%22' + resources.artifactId + '%22&core=gav&rows=20'
    var options = {
      uri: baseUri,
      json: true
    }

    return rp(options)
      .then(function (result) {
        var body = result.response.docs
        var pomUriListEachVer = {}

        for (ver in body) {
          var artifactId = body[ver].a
          var groupId = body[ver].g.split('.')
          var version = body[ver].v
          var published = body[ver].timestamp
          published = moment(published).format()

          if (filterLessThanOneYear(published) && createSlashedGroupId(groupId)) {
            var pomUri = createPomUrl(groupId, artifactId, version)

            pomUriListEachVer[version] = {
              artifactId,
              version,
              published,
              pomUri
            }
          }
        }
        pomUriList.push(pomUriListEachVer)
        return pomUriList
      })
  })
}

function getEachPomFileContent(pomUriList) {
  return _.map(pomUriList, function (result) {

    return Promise.all(_.map(result, function(ver) {
      var options = {
        uri: ver.pomUri
      }
      var artifactId = ver.artifactId
      var published = ver.published
      var version = ver.version

      return rp(options)
        .then(function (response) {
          var eachVersionResponse = {
            version: version,
            artifactId: artifactId,
            published: published,
            response: response
          }
          return eachVersionResponse
        })
    })).then(function (result) {
      responseList.push(result)
    })
  })
}

function parseXmlToJson(responseList) {
  return _.map(responseList, function (response) {
    return Promise.all(_.map(response, function (ver) {
      // parse each pom.xml to JSON format
      return xml2js.parseStringAsync(ver.response, {explicitArray: false})
        .then(function (result) {
          var projectDeps = result.project.dependencies
          var projectDepManages = result.project.dependencyManagement
          var name = result.project.artifactId
          var groupId = result.project.groupId ? result.project.groupId : result.project.parent.groupId
          var artifactId = result.project.artifactId
          var version = result.project.version ? result.project.version : result.project.parent.version
          var description = result.project.description ? result.project.description : result.project.name
          var published = ver.published

          var dependencies
          if (projectDeps) {
            dependencies = projectDeps.dependency
          } else if (projectDepManages) {
            dependencies = projectDepManages.dependencies.dependency
          } else dependencies = undefined

          var eachVerBodyList = {
            name: name,
            groupId: groupId,
            artifactId: artifactId,
            version: version,
            description: description,
            published: published,
            dependencies: dependencies
          }
          return eachVerBodyList
      })
    }))
    .then(function (result) {
      bodyList.push(result)
    })
  })
}

function filterWithGivenArtifact(bodyList) {
  return _.map(bodyList, function (version) {

    return Promise.all(_.map(version, function (dep) {
      const type = 'INTERPRETER'
      const license = 'Apache-2.0'
      const icon = '<i class=\"fa fa-rocket\"></i>'
      var dependency = dep.dependencies
      var name = dep.name
      var groupId = dep.groupId
      var artifactId = dep.artifactId
      var version = dep.version
      var artifact = artifactId + '@' + version
      var description = dep.description? dep.description : name
      var published = dep.published

      var result = dependency ? _.findWhere(dependency, {artifactId: 'zeppelin-interpreter'}) : undefined

      return finalArtifactEachVer =
        result
          ?
        {
          type: type,
          name: name,
          version: version,
          published: published,
          artifact: artifact,
          description: description,
          license: license,
          icon: icon,
          groupId: groupId,
          artifactId: artifactId
        }
          :
        undefined
    }))
      .then(function (result) {
        var resultByVersion = _.indexBy(_.omit(result, _.isUndefined), 'version')
        finalArtifactList.push(resultByVersion)
      })
  })
}

var AWS = require('aws-sdk')
AWS.config.setPromisesDependency(require('bluebird'))
var s3 = new AWS.S3(
  {
    signatureVersion: 'v4',
    maxRetries: 3
  }
)

function createEachPkgInfoFile(body, artifactId) {
  const bucketName = 'zepl-dev'
  const folderName = 'home/AhyoungRyu/packages/'

  var content = {
    Bucket: bucketName,
    Key: folderName + artifactId + '.json',
    Body: body,
    ACL: 'public-read'
  }

  var putObjectPromise = s3.putObject(content).promise()

  putObjectPromise
    .then(function (data) {
      console.log(data)
    })
}

var uri = 'http://search.maven.org/solrsearch/select?q=zeppelin&rows=100'
searchOnlyZeppelinRelatedArtifact(uri)
  .delay(2000)
  .then(function (result) {
    return getAllVersionInfo(result)
  })
  .delay(3000)
  .then(function () {
    return getEachPomFileContent(pomUriList)
  })
  .delay(3000)
  .then(function () {
    return parseXmlToJson(responseList)
  })
  .delay(3000)
  .then(function () {
    return filterWithGivenArtifact(bodyList)
  })
  .delay(3000)
  .then(function () {
    _.map(finalArtifactList, function (artifact) {
      if(!_.isEmpty(artifact)) {
        for (key in artifact) {
          var artifactId = artifact[key].artifactId
        }
        var body = {}
        body[artifactId] = artifact
        body = stringify(body)

        createEachPkgInfoFile(body, artifactId)
      }
    })
  })
  .catch(function (error) {
    console.error(error.message)
  })