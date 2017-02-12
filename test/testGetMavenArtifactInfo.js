var rp = require('request-promise')
var moment = require('moment')
var parseString = require('xml2js').parseString
var _ = require("underscore")

var options = {
  uri:'http://search.maven.org/solrsearch/select?q=zeppelin&rows=100',
  json: true
}
var pomUriList = []
var responseList = []
var bodyList = []
var body
var finalArtifactList = []

rp(options)
  .then(function (result) {
    var baseUri = 'http://repo1.maven.org/maven2/'
    var body = result.response.docs
    var duration = moment.duration({'year' : 1})
    var oneYearAgo = moment().subtract(duration).format()

    // get each artifact's uri to access its pom.xml
    for (artifact in body) {
      var slashedGroupId = ""
      var artifactId = body[artifact].a
      var version = body[artifact].latestVersion

      //create uri by spliting groupId e.g. org.apache.zeppelin -> org/apache/zeppelin/
      var groupId = body[artifact].g.split('.')
      var published = body[artifact].timestamp
      published = moment(published).format()

      // filter only artifacts created within 1 year from now
      if (moment(published).isAfter(oneYearAgo)) {
        for (id in groupId) {
          var text = groupId[id] + '/'
          slashedGroupId = slashedGroupId.concat(text)
        }
      }

      // extract only valid uri
      // e.g. http://repo1.maven.org/maven2/org/apache/zeppelin/zeppelin-zrinterpreter_2.11/0.7.0/
      if (slashedGroupId) {
        var uri = baseUri + slashedGroupId + artifactId + '/' + version + '/'
        var pomUri = uri + artifactId + '-' + version + '.pom'
        pomUriList.push(pomUri)
      }
    }

    return pomUriList
  })
  .then(function () {
    pomUriList.map(function (uri) {
      var eachOption = {
        uri: uri
      }
      return rp(eachOption)
        .then(function (response) {
          responseList.push(response)
          return responseList
        })
      })
  })
  .delay(3000)
  .then(function () {
    responseList.map(function (response) {

      // parse each pom.xml to JSON format
      return parseString(response, {explicitArray: false}, function (err, result) {
        var projectDeps = result.project.dependencies
        var projectDepManages = result.project.dependencyManagement
        var key = result.project.artifactId

        if (projectDeps) {
          body = projectDeps.dependency
        } else if (projectDepManages) {
          body = projectDepManages.dependencies.dependency
        } else {
          body = undefined
        }

        bodyList.push({key, body})

        return bodyList
      })
    })
  })
  .delay(3000)
  .then(function () {
    var result
    for (dep in bodyList) {
      var list = bodyList[dep].body

      result = list ? _.where(list, {artifactId: 'zeppelin-interpreter'}) : undefined

      console.log(bodyList[dep].key + ' ---- ' + result)
      /*if (result) {
        finalArtifactList.push(bodyList[dep].key)
      }*/
    }
    //console.log(finalArtifactList)
  })
  .catch(function (error) {
    console.error(error.message)
  })