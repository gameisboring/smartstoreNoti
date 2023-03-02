var socket = io()
var list = []
var el

socket.emit('orderList', 'test')

setInterval(async () => {
  socket.emit('orderList', 'noti')
}, 3000)

socket.on('orderList', (msg) => {
  if (typeof msg == 'string') {
    console.log(msg)
  } else if (typeof msg == 'object') {
    msg.forEach((element) => {
      list.push(element)
      console.log(element)
    })
  } else {
    return
  }
  if (list.length > 0) {
    console.log(list)
    el = list.shift()
    Swal.fire({
      title: `${el.nick}님 ${el.productName} 구매하셨습니다`,
      html: `${el.text}`,
      timer: 8000,
      imageUrl: 'https://placeholder.pics/svg/300x300',
      imageHeight: 300,
      imageAlt: 'A image',
      color: '#716add',
      showConfirmButton: false,
      background: 'transparent',
      backdrop: `
    rgba(0,0,0,0.0)`,
    }).then((result) => {
      if (result.dismiss === Swal.DismissReason.timer) {
        console.log('I was closed by the timer')
      }
    })
  }
})
