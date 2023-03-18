const express = require('express')
const electron = require('electron')
const path = require('path')
const fs = require('fs')
const log = require('electron-log')
const multer = require('multer')
const { dateFormat, hoursAgo } = require('./time')
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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.resourcesPath, '/public/sound'))
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  },
})

const upload = multer({ storage: storage })

const ApiControls = require('./api')
// const ttsConfig = require('./ttsConfig')
const api = new ApiControls()

app2.use(express.static('public'))
app2.use(express.static(path.join(process.resourcesPath, '/public')))

app2.get('/', function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/json;charset=utf-8' })
  res.end('{"testcode":"200", "text":"서버 작동 중"}')
})

app2.get('/notification', async function (req, res) {
  // obs 에서 상호작용 없이 소리 재생
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

app2.get('/order/counter', async function (req, res) {
  // log.info(`GET /order/counter`)
  const count = await api.getCounter()
  res.json(count)
})

app2.get('/scoreboard', async function (req, res) {
  log.info(`GET /scoreboard`)
  const dataList = await api.scoreBoardToUsableData()
  res.json(dataList)
})

app2.get('/scoreboard/result', async function (req, res) {
  log.info(`GET /scoreboard`)
  const dataList = await api.scoreBoardResult()
  fs.writeFile(
    path.join(
      process.resourcesPath,
      '/list',
      dateFormat(hoursAgo(6)) + '_result.json'
    ),
    JSON.stringify(dataList),
    function () {
      res.download(
        path.join(
          process.resourcesPath,
          '/list',
          dateFormat(hoursAgo(6)) + '_result.json'
        )
      )
    }
  )
})

app2.get('/scoreboard/get', async function (req, res) {
  log.info(`GET /scoreboard/get`)
  const dataList = await api.getScoreList()
})

/* 설정 가져오기 */
app2.get('/config', function (req, res) {
  log.info(`GET /config`)
  if (!fs.existsSync(process.resourcesPath + '/APIconfig.json')) {
    log.info(`please write file "APIconfig.json"`)
  } else {
    res.send(
      JSON.parse(fs.readFileSync(process.resourcesPath + '/APIconfig.json'))
    )
  }
})

/* TTS 설정 가져오기 */
app2.get('/config/tts', function (req, res) {
  log.info(`GET /config/tts`)
  if (!fs.existsSync(process.resourcesPath + '/ttsConfig.json')) {
    log.info(`please write file "ttsConfig.json"`)
  } else {
    res.send(
      JSON.parse(fs.readFileSync(process.resourcesPath + '/ttsConfig.json'))
    )
  }
})

/* 설정 변경 */
app2.post('/config', function (req, res) {
  log.info(`POST /config`)
  if (req.body) {
    fs.writeFile(
      process.resourcesPath + '/APIconfig.json',
      JSON.stringify(req.body),
      'utf-8',
      () => {
        console.log(JSON.stringify(req.body))
        res.send(true)
      }
    )
  } else {
    res.send(false)
  }
})

// 다중 파일 업로드
app2.post('/config/tts', upload.array('soundFile'), (req, res, next) => {
  let obj = JSON.parse(JSON.stringify(req.body))
  if (req.body) {
    fs.writeFile(
      process.resourcesPath + '/ttsConfig.json',
      JSON.stringify(obj),
      'utf-8',
      () => {
        console.log(JSON.stringify(obj))
        res.status(200).send({
          message: 'Ok',
          fileInfo: req.files,
        })
      }
    )
  }
})

app2.get('/noti/image', function (req, res) {
  log.info(`GET /noti/image`)
  if (fs.existsSync(process.resourcesPath + '/noti.png')) {
    res.sendFile(process.resourcesPath + '/noti.png')
  } else {
    res.sendFile(__dirname + '/public/images/handsup.png')
  }
})

// app2.get('/noti/config', async function (req, res) {
//   log.info(`GET /noti/config`)
//   res.send(await ttsConfig())
// })

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

  socket.on('getOrderList', async (msg) => {
    log.info('getOrderList', msg)
    await api.getOrderList()
  })

  socket.on('getScoreboard', async (msg) => {
    log.info('getScoreboard', msg)
    socket.emit('scoreboard', await api.scoreBoardToUsableData())
  })
})

module.exports = app2
