function setEachVersionInfo (dependency, data) {
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
module.exports = setEachVersionInfo