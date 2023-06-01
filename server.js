const express = require('express')
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

const SoundStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.resourcesPath, '/public/sounds'))
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  },
})
const ImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.resourcesPath, '/public/images'))
  },
  filename: function (req, file, cb) {
    cb(null, 'noti.png')
  },
})

const SoundUpload = multer({ storage: SoundStorage })
const ImageUpload = multer({ storage: ImageStorage })

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

app2.get('/order/count', async function (req, res) {
  // log.info(`GET /order/counter`)
  const count = await api.getCountForClient()
  res.json(count)
})

app2.get('/order/result', async function (req, res) {
  // log.info(`GET /order/counter`)
  const count = await api.getCountForAdmin()
  fs.writeFile(
    path.join(
      process.resourcesPath,
      '/list',
      dateFormat(new Date()) + '_result.json'
    ),
    JSON.stringify(count),
    function () {
      res.json({
        url: dateFormat(new Date()) + '_result.json',
      })
    }
  )
})

app2.get('/scoreboard', async function (req, res) {
  log.info(`GET /scoreboard`)
  const dataList = await api.scoreBoardToUsableData()
  res.json(dataList)
})

app2.get('/scoreboard/result', async function (req, res) {
  log.info(`GET /scoreboard/result`)
  const dataList = await api.scoreBoardResult()
  fs.writeFile(
    path.join(
      process.resourcesPath,
      '/list',
      dateFormat(new Date()) + '_pointResult.json'
    ),
    JSON.stringify(dataList),
    function () {
      res.json({ url: dateFormat(new Date()) + '_pointResult.json' })
    }
  )
})

app2.get('/scoreboard/get', async function (req, res) {
  log.info(`GET /scoreboard/get`)
  const dataList = await api.getScoreList()
  res.json(dataList)
})

/* 설정 가져오기 */
app2.get('/config', function (req, res) {
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
        log.info('API 설정변경', JSON.stringify(req.body))
        res.send(true)
      }
    )
  } else {
    res.send(false)
  }
})

// 다중 파일 업로드
app2.post('/config/tts', SoundUpload.array('soundFile'), (req, res, next) => {
  let obj = JSON.parse(JSON.stringify(req.body))
  if (req.body) {
    try {
      let data = JSON.parse(
        fs.readFileSync(process.resourcesPath + '/ttsConfig.json', 'utf-8')
      )

      data.FIRST_SOUND_UP = obj.FIRST_SOUND_UP
      data.FIRST_SOUND_DOWN = obj.FIRST_SOUND_DOWN
      data.SECOND_SOUND_UP = obj.SECOND_SOUND_UP
      data.SECOND_SOUND_DOWN = obj.SECOND_SOUND_DOWN
      data.THIRD_SOUND_UP = obj.THIRD_SOUND_UP
      data.THIRD_SOUND_DOWN = obj.THIRD_SOUND_DOWN
      data.FIRST_SOUND_FILE = obj.FIRST_SOUND_FILE
      data.SECOND_SOUND_FILE = obj.SECOND_SOUND_FILE
      data.THIRD_SOUND_FILE = obj.THIRD_SOUND_FILE

      fs.writeFile(
        process.resourcesPath + '/ttsConfig.json',
        JSON.stringify(data),
        'utf-8',
        () => {
          log.info('알림 조건 설정 변경', JSON.stringify(obj))
          res.status(200).send({
            ok: true,
          })
        }
      )
    } catch (error) {
      log.error(error)
      res.status(200).send({
        ok: false,
      })
    }
  }
})

// 다중 파일 업로드
app2.post('/config/speak', (req, res, next) => {
  let obj = JSON.parse(JSON.stringify(req.body))
  if (req.body) {
    try {
      let data = JSON.parse(
        fs.readFileSync(process.resourcesPath + '/ttsConfig.json', 'utf-8')
      )
      data.SPEAKING_RATE = obj.SPEAKING_RATE
      data.SPEAKING_VOICE = obj.SPEAKING_VOICE
      data.DIALOG_FORM = obj.DIALOG_FORM
      fs.writeFile(
        process.resourcesPath + '/ttsConfig.json',
        JSON.stringify(data),
        'utf-8',
        () => {
          log.info('TTS Voice 설정 변경', JSON.stringify(obj))
          res.status(200).send({
            ok: true,
          })
        }
      )
    } catch (error) {
      log.error(error)
      res.status(200).send({
        ok: false,
      })
    }
  }
})

/* 설정 변경 */
app2.post('/config/test', function (req, res) {
  log.info(`POST /config/test`)
  if (req.body) {
    io.emit('orderList', [
      {
        quantity: req.body.TEST_QUANTITY,
        nick: req.body.TEST_NICK,
        text: req.body.TEST_TEXT,
        bj: req.body.TEST_BJ,
        point: req.body.TEST_POINT,
        productName: req.body.TEST_PRODUCT,
      },
    ])
    res.send({ ok: true })
  } else {
    res.send(false)
  }
})

app2.get('/noti/image', function (req, res) {
  log.info(`GET /noti/image`)
  if (fs.existsSync(process.resourcesPath + '/public/images/noti.png')) {
    res.sendFile(process.resourcesPath + '/public/images/noti.png')
  }
})

app2.post('/noti/image', (req, res, next) => {
  log.info(`POST /noti/image`)
  const uploadSingleImage = ImageUpload.single('imageFile')
  uploadSingleImage(req, res, function (err) {
    const file = req.file
    log.info('알림 이미지 변경', file)
    if (err) {
      log.error(err)
      return res.status(400).send({ message: err })
    }
    res.status(200).send({ message: 'ok', ok: true })
  })
})

app2.get('/noti/stop', function (req, res) {
  log.info(`GET /noti/stop`)
  io.emit('stop', 'notification stop !!!')
  res.send(true)
})

app2.get('/noti/resume', function (req, res) {
  log.info(`GET /noti/resume`)
  io.emit('resume', 'notification resume !!!')
  res.send(true)
})

/* app2.get('/tts/:text/:speakingRate', async function (req, res) {
  await quickStart(req.params.text, req.params.speakingRate)
    .then(() => {
      res.sendFile(path.join(process.resourcesPath, '/public/output.mp3'))
    })
    .catch((reason) => {
      log.error('quickStart', reason)
      res.send(reason)
    })
}) */

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

  socket.on('test', function (msg) {
    socket.emit('test', msg)
  })
})

module.exports = app2
