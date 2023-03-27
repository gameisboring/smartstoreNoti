const electron = require('electron')
const path = require('path')
const { dateFormat, hoursAgo } = require('./time')
const log = require('electron-log')
log.transports.file.level = 'info'
log.transports.file.fileName = dateFormat(hoursAgo(6)) + '.log'
var ipAdress = require('ip').address()

/**
 * TODO
 * 1. 집계방식 다른걸로 api 함수 하나 더 만들기
 * 2. client html 작업
 * 3. 경로 ../Romaing 쪽에 있게 하지 말고 client resource 쪽으로 재설정하기
 * 4. TTS 음성 범위 재설정
 */

// File control
require('./fileControl')()

log.info(ipAdress)

// 애플리케이션 생명주기를 조작 하는 모듈.
const { app } = electron
var appResourcePath = process.resourcesPath
// express 서버
require('./server')

// 네이티브 브라우저 창을 만드는 모듈.
const { BrowserWindow, Menu } = electron

log.info('program directory', appResourcePath)
// 메뉴 끄기
// Menu.setApplicationMenu(false)
// 하드웨어 가속 끄기
app.disableHardwareAcceleration()

// 윈도우 객체를 전역에 유지합니다. 만약 이렇게 하지 않으면
// 자바스크립트 GC가 일어날 때 창이 멋대로 닫혀버립니다.
let win

function createWindow() {
  // 새로운 브라우저 창을 생성합니다.
  win = new BrowserWindow({
    width: 800,
    height: 886,
    resizable: false,
    useContentSize: true,
    titleBarStyle: 'hiddenInset',
    icon: path.join(__dirname, 'public/images/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // enableRemoteModule: true,
    },
  })

  // 그리고 현재 디렉터리의 client.html을 로드합니다.
  win.loadURL(`file://${__dirname}/client2.html`)
  // 웹 페이지 로드 완료
  win.webContents.on('did-finish-load', (evt) => {
    // ipAddress 이벤트 송신
    win.webContents.send('ipAddress', ipAdress)
    // electron.app.getPath('appData') 송신
    win.webContents.send(
      'userData',
      path.join(electron.app.getPath('userData'), '/logs')
    )

    win.webContents.send(
      'pointList',
      path.join(
        process.resourcesPath,
        '/list',
        dateFormat(hoursAgo(6)) + '_pointList.json'
      )
    )

    win.webContents.send(
      'orderList',
      path.join(
        process.resourcesPath,
        '/list',
        dateFormat(hoursAgo(6)) + '_list.json'
      )
    )
  })

  // 개발자 도구를 엽니다.
  // win.webContents.openDevTools()

  // 창이 닫히면 호출됩니다.
  win.on('closed', () => {
    // 윈도우 객체의 참조를 삭제합니다. 보통 멀티 윈도우 지원을 위해
    // 윈도우 객체를 배열에 저장하는 경우가 있는데 이 경우
    // 해당하는 모든 윈도우 객체의 참조를 삭제해 주어야 합니다.
    win = null
  })
}

// 이 메서드는 Electron의 초기화가 끝나면 실행되며 브라우저
// 윈도우를 생성할 수 있습니다. 몇몇 API는 이 이벤트 이후에만
// 사용할 수 있습니다.
app.on('ready', createWindow)

// 모든 창이 닫히면 애플리케이션 종료.
app.on('window-all-closed', () => {
  // macOS의 대부분의 애플리케이션은 유저가 Cmd + Q 커맨드로 확실하게
  // 종료하기 전까지 메뉴바에 남아 계속 실행됩니다.
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // macOS에선 보통 독 아이콘이 클릭되고 나서도
  // 열린 윈도우가 없으면, 새로운 윈도우를 다시 만듭니다.
  if (win === null) {
    createWindow()
  }
})

// 이 파일엔 제작할 애플리케이션에 특화된 메인 프로세스 코드를
// 포함할 수 있습니다. 또한 파일을 분리하여 require하는 방법으로
// 코드를 작성할 수도 있습니다.
