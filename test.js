var RegClient = require('silent-npm-registry-client')
var stream = require('stream')
var stringify = require('json-stringify-pretty-compact')

var npmPkgSearchByDependency = require('npm-pkg-searchby-dependency')
var dependency = 'zeppelin-vis'

/*
 run this file if you need to check in local
 npm run test
*/
npmPkgSearchByDependency(dependency, function (error, packages) {
    if (error) {
      console.error(error)
      process.exit(-1)
    }

    var N = packages.length
    var uriList = []
    var params = { timeout: 1000 }
    var client = new RegClient({logstream: new stream.Writable()})
    const type = "VISUALIZATION"

    console.log('\nPackages matching \"' + dependency + '\": (' + N + ')\n')
    packages.forEach(function (pkg) {
      var registryURL = 'https://registry.npmjs.org/' + pkg.name + '/latest'
      uriList.push(registryURL)
    })
    console.log('')

    var finalResult = []
    var iter = N
    uriList.forEach(function (uri) {
      client.get(uri, params, function (error, data) {
        if (error) {
          return callback(error)
        }

        var result = {
          type: type,
          name: data.name,
          description: data.description,
          artifact: data._id,
          license: data.license,
          icon: (data.icon == undefined) ? '<i class="fa fa-plug"></i>' : data.icon
        }

        console.log(stringify(result))
        finalResult.push(result)

        if (N < iter) {
          console.log(stringify(finalResult))
          var fakeJsContent = 'var zeppelinHeliumPackages = ' + stringify(finalResult);
          console.log(fakeJsContent);
        }
        iter++
      })
    })
})