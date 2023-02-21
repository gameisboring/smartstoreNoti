const express = require('express')
const PORT = 3000
const app2 = express()
const server = app2.listen(PORT, function () {
  console.log(`Server Running on ${PORT} Port`)
})

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

io.on('connection', function (socket) {
  console.log(socket.id, 'Connected')

  socket.emit('msg', `${socket.id} 연결 되었습니다.`)

  socket.on('orderList', (msg) => {
    setInterval(async () => {
      socket.emit('orderList', await api.getOrderList())
    }, 3000)
  })
})

module.exports = app2
