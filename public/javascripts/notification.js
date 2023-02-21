var socket = io()

socket.emit('orderList', 'test')
var list = []

socket.on('orderList', (msg) => {
  console.log(msg)

  if (typeof msg == 'object') {
    for (var i in msg) {
      list.push(msg[i])
      document.querySelector('.nick').innerHTML = msg[i].nick
      document.querySelector('.text').innerHTML = msg[i].text
      document.querySelector('.streamer').innerHTML = msg[i].streamerName
      document.querySelector('.product').innerHTML = msg[i].productName
      setTimeout(() => {}, 3000)
    }
  } else {
  }
})

socket.on('msg', (msg) => {
  console.log(msg)
})
