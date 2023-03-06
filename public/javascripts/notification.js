var socket = io()
var list = []

socket.emit('orderList', 'test')

setInterval(async () => {
  socket.emit('orderList', 'noti')
}, 7000)
setInterval(() => {
  if (list.length > 0) {
    displayNotification()
  }
}, 3000)

var displayNotification = () => {
  console.log('현재 : ' + list.length + '개 남음')
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
    didOpen: () => {
      const span = Swal.getHtmlContainer().querySelector('span')
    },
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
