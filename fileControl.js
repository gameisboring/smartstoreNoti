module.exports = () => {
  console.log('file control')
  const fs = require('fs')
  const log = require('electron-log')
  const basicAPIconfig = require('./APIconfig.json')
  const basicTTSconfig = require('./ttsConfig.json')
  const { dateFormat, hoursAgo } = require('./time')
  var appResourcePath = process.resourcesPath
  var check = {
    APIconfigFile: false,
    ttsConfigFile: false,
    listFolder: false,
    listFile: false,
    pointListFile: false,
  }

  // check api config file
  try {
    fs.readFileSync(appResourcePath + '/APIconfig.json')
  } catch (error) {
    log.info(`file writing .... APIconfig.json`)
    fs.writeFile(
      appResourcePath + '/APIconfig.json',
      JSON.stringify(basicAPIconfig),
      () => {
        check.APIconfigFile = appResourcePath + '/APIconfig.json'
      }
    )
  }

  // check notification config file
  try {
    fs.readFileSync(appResourcePath + '/ttsConfig.json')
  } catch (error) {
    log.info(`file writing .... ttsConfig.json`)
    fs.writeFile(
      appResourcePath + '/ttsConfig.json',
      JSON.stringify(basicTTSconfig),
      () => {
        check.ttsConfigFile = appResourcePath + '/ttsConfig.json'
      }
    )
  }

  //  check list Folder
  try {
    fs.readdirSync(appResourcePath + '/list')
  } catch (error) {
    log.info(`folder making .... ${appResourcePath}/list`)
    fs.mkdir(appResourcePath + '/list', () => {
      check.listFolder = appResourcePath + '/list'
    })
  }

  //   check list file
  try {
    fs.readFileSync(
      appResourcePath + '/list' + `/${dateFormat(new Date())}_list.json`
    )
  } catch {
    log.info(`file writing .... ${dateFormat(new Date())}_list.json`)
    fs.writeFile(
      appResourcePath + '/list' + `/${dateFormat(new Date())}_list.json`,
      '[]',
      () => {
        check.listFile =
          appResourcePath + '/list' + `/${dateFormat(new Date())}_list.json`
      }
    )
  }

  //   check point list file
  try {
    fs.readFileSync(
      appResourcePath + '/list' + `/${dateFormat(new Date())}_pointList.json`
    )
  } catch {
    log.info(`file writing .... ${dateFormat(new Date())}_pointList.json`)
    fs.writeFile(
      appResourcePath + '/list' + `/${dateFormat(new Date())}_pointList.json`,
      '[]',
      () => {
        check.pointListFile =
          appResourcePath +
          '/list' +
          `/${dateFormat(new Date())}_pointList.json`
      }
    )
  }
}
