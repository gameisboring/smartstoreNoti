// export default async () => {
const fs = require('fs')
fs.readFile(process.resourcesPath + '/ttsConfig.json', (config) => {
  console.log(config)
  var code = ''
  for (var i in config) {
    if (i == 0) {
      code = `if (el.quantity >= ${config[i].이상} && el.quantity < ${config[i].미만}) {
            notiSound.src = 'sounds/${config[i].sound}'}`
    } else {
      code += `else if (el.quantity >= ${config[i].이상} && el.quantity < < ${config[i].미만}) {
            notiSound.src = 'sounds/${config[i].sound}'
          }`
    }
  }

  code += `else {
        return
      }`

  console.log(code)
  return code
})
