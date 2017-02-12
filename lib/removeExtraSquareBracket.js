var stringify = require('json-stringify-pretty-compact')

function removeExtraSquareBracket(jsonArray) {
  jsonArray = jsonArray.map(function(e){
    return stringify(e)
  })

  return jsonArray.join(",")
}
module.exports = removeExtraSquareBracket