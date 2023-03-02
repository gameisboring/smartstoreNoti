const express = require('express')
const electron = require('electron')
const fs = require('fs')

const elApp = electron.app
const PORT = 3000
const app2 = express()
const server = app2.listen(PORT, function () {
  console.log(`Server Running on ${PORT} Port`)
})

app2.use(express.json())
app2.use(express.urlencoded({ extended: false }))

const SocketIO = require('socket.io')
const io = SocketIO(server, { path: '/socket.io' })

const ApiControls = require('./api')
const api = new ApiControls()

app2.use(express.static('public'))

app2.get('/', function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/json;charset=utf-8' })
  res.end('{"testcode":"200", "text":"Electorn Test~"}')
})

app2.get('/notification', async function (req, res) {
  io.emit('orderList', await api.getOrderList())
  res.sendFile(__dirname + '/views/notification.html')
})

app2.get('/test', async function (req, res) {
  const dataList = await api.getProductList()
  res.send(dataList)
})

app2.get('/change', async function (req, res) {
  const dataList = await api.getChangeList()
  res.send(dataList)
})

app2.get('/order', async function (req, res) {
  const dataList = await api.getOrderList()

  res.send(dataList)
})

/* 설정 가져오기 */
app2.get('/config', function (req, res) {
  res.send(
    JSON.parse(fs.readFileSync(elApp.getPath('userData') + '/APIconfig.json'))
  )
})

/* 설정 변경 */
app2.post('/config', function (req, res) {
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

io.on('connection', function (socket) {
  console.log(socket.id, 'Connected')

  socket.emit('msg', `${socket.id} 연결 되었습니다.`)

  socket.on('orderList', async (msg) => {
    socket.emit('orderList', await api.getOrderList())
  })
})

module.exports = app2
