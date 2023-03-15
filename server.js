const express = require('express')
const electron = require('electron')

const fs = require('fs')
const log = require('electron-log')

const elApp = electron.app
const PORT = 3000
const app2 = express()
const server = app2.listen(PORT, function () {
  log.info(`Server Running on ${PORT} Port`)
})

app2.use(express.json())
app2.use(express.urlencoded({ extended: false }))

const SocketIO = require('socket.io')
const io = SocketIO(server, { path: '/socket.io' })
module.exports = { io }

const ApiControls = require('./api')
const api = new ApiControls()

app2.use(express.static('public'))
// app2.use(express.static(process.resourcesPath + '/app.asar/public'))

app2.get('/', function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/json;charset=utf-8' })
  res.end('{"testcode":"200", "text":"Electorn Test~"}')
})

app2.get('/notification', async function (req, res) {
  res.setHeader('Permissions-Policy', "autoplay '*'")
  log.info(`GET /notification`)
  res.sendFile(__dirname + '/views/notification.html')
})

app2.get('/board', async function (req, res) {
  log.info(`GET /board`)
  res.sendFile(__dirname + '/views/board.html')
})

app2.get('/test', async function (req, res) {
  log.info(`GET /test`)
  res.sendFile(__dirname + '/views/test.html')
})

/**
 * 서버 분리로 이 프로그램에서 사용안함
 * 
  const { quickStart } = require('./tts') 
  app2.get('/tts/:text', async function (req, res) {
  await quickStart(req.params.text)
    .then(() => {
      res.sendFile(process.resourcesPath + '/output.mp3')
    })
    .catch((reason) => {
      console.error('quickStart', reason)
    })
}) */

app2.get('/change', async function (req, res) {
  log.info(`GET /change`)
  const dataList = await api.getChangeList()
  res.json(dataList)
})

app2.get('/order', async function (req, res) {
  log.info(`GET /order`)
  const dataList = await api.getOrderList()
  res.send(dataList)
})

app2.get('/scoreboard', async function (req, res) {
  log.info(`GET /scoreboard`)
  const dataList = await api.scoreBoardToUsableData()
  res.json(dataList)
})

app2.get('/scoreboard/get', async function (req, res) {
  log.info(`GET /scoreboard/get`)
  const dataList = await api.getScroeList()
  res.json(dataList)
})

/* 설정 가져오기 */
app2.get('/config', function (req, res) {
  log.info(`GET /config`)
  if (!fs.existsSync(elApp.getPath('userData') + '/APIconfig.json')) {
    log.info(`please write file "APIconfig.json"`)
  } else {
    res.send(
      JSON.parse(fs.readFileSync(elApp.getPath('userData') + '/APIconfig.json'))
    )
  }
})

/* 설정 변경 */
app2.post('/config', function (req, res) {
  log.info(`POST /config`)
  if (req.body) {
    fs.writeFileSync(
      elApp.getPath('userData') + '/APIconfig.json',
      JSON.stringify(req.body),
      'utf-8'
    )
    res.json({ message: '입력되었습니다' })
  } else {
    res.json({ message: '입력에 실패했습니다' })
  }
})

app2.get('/noti/image', function (req, res) {
  log.info(`GET /noti/image`)
  if (fs.existsSync(elApp.getPath('userData') + '/noti.png')) {
    res.sendFile(elApp.getPath('userData') + '/noti.png')
  } else {
    res.sendFile(__dirname + '/public/images/handsup.png')
  }
})

app2.get('/noti/stop', function (req, res) {
  log.info(`GET /noti/stop`)
  console.log('stop')
  io.emit('stop', 'notification stop !!!')
  res.send(true)
})

app2.get('/noti/resume', function (req, res) {
  log.info(`GET /noti/resume`)
  console.log('resume')
  io.emit('resume', 'notification resume !!!')
  res.send(true)
})

io.on('connection', function (socket) {
  log.info(socket.id, 'Connected')
  socket.emit('connection', `${socket.id} 연결 되었습니다.`)

  socket.on('orderList', async (msg) => {
    log.info('orderList', msg)
    socket.emit('orderList', await api.getOrderList())
  })

  socket.on('scoreboard', async (msg) => {
    log.info('scoreboard', msg)
    socket.emit('scoreboard', await api.scoreBoardToUsableData())
  })
})

module.exports = app2
