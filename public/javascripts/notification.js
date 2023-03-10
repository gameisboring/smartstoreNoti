var socket = io()
var list = []
var notiInfoReqInterval

// let notiInfoReqInterval = setInterval(callback, 1000)

async function callback() {
  console.log('Socket Emit')
  socket.emit('orderList', new Date().getTime())
}

socket.on('disconnect', (reason) => {
  console.log(reason)
  clearInterval(notiInfoReqInterval)
})

socket.on('connection', (reason) => {
  console.log(reason)
  notiInfoReqInterval = setInterval(callback, 10000)
})

setInterval(() => {
  if (list.length > 0) {
    displayNotification()
  }
}, 3000)

var displayNotification = () => {
  console.log('남은 알림 현재 : ' + list.length + '개 남음')
  var el = list.shift()
  Swal.fire({
    title: `<span class="nick">${el.nick}</span>님
    <span class="productName">${el.productName}</span> <span class="quantity">${el.quantity}</span>개
    구매 감사합니다
    <span class="point">${el.bj} ${el.point}</span>`,
    html: `<span class="msgText">${el.text}</span>`,
    timer: 3000,
    imageUrl: '/noti/image',
    imageHeight: 300,
    imageAlt: 'A image',
    color: '#716add',
    showConfirmButton: false,
    background: 'transparent',
    backdrop: `rgba(0,0,0,0.0)`,
  }).then((result) => {
    if (result.dismiss === Swal.DismissReason.timer) {
      console.log('I was closed by the timer')
    }
  })
}

socket.on('orderList', (msg) => {
  if (typeof msg == 'string') {
    console.log(msg)
  } else if (typeof msg == 'object') {
    msg.forEach((element) => {
      list.push(element)
    })
  } else {
    return
  }
})
