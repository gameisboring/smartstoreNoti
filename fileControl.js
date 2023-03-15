module.exports = () => {
  console.log('file control')
  const fs = require('fs')
  const log = require('electron-log')
  const basicAPIconfig = require('./APIconfig.json')
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
  } finally {
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
  } finally {
    fs.writeFile(
      appResourcePath + '/ttsConfig.json',
      JSON.stringify(basicAPIconfig),
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
  } finally {
    fs.mkdir(appResourcePath + '/list', () => {
      check.listFolder = appResourcePath + '/list'
    })
  }
  //   check list file
  try {
    fs.readFileSync(
      appResourcePath + '/list' + `/${dateFormat(hoursAgo(6))}_list.json`
    )
  } catch {
    log.info(`file writing .... ${dateFormat(hoursAgo(6))}_list.json`)
  } finally {
    fs.writeFile(
      appResourcePath + '/list' + `/${dateFormat(hoursAgo(6))}_list.json`,
      '[]',
      () => {
        check.listFile =
          appResourcePath + '/list' + `/${dateFormat(hoursAgo(6))}_list.json`
      }
    )
  }

  //   check point list file
  try {
    fs.readFileSync(
      appResourcePath + '/list' + `/${dateFormat(hoursAgo(6))}_pointList.json`
    )
  } catch {
    log.info(`file writing .... ${dateFormat(hoursAgo(6))}_pointList.json`)
  } finally {
    fs.writeFile(
      appResourcePath + '/list' + `/${dateFormat(hoursAgo(6))}_pointList.json`,
      '[]',
      () => {
        check.pointListFile =
          appResourcePath +
          '/list' +
          `/${dateFormat(hoursAgo(6))}_pointList.json`
      }
    )
  }
}
