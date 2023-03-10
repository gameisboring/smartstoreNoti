var socket = io('http://localhost:3000')
var list = []
var notiInfoReqInterval
var notiPopUpInterval
var notiSound = new Audio(`sounds/fist.mp3`)

document.querySelector('#start').addEventListener('click', (event) => {
  event.preventDefault()
  document.querySelector('#start').style.display = 'none'
})

// let notiInfoReqInterval = setInterval(callback, 1000)

/* async function notiReqCallback() {
  console.log('Socket Emit')
  socket.emit('orderList')
} */

async function notiPopUpCallback() {
  if (list.length > 0) {
    displayNotification()
  }
}

socket.on('disconnect', (reason) => {
  console.log(reason)
  clearInterval(notiInfoReqInterval)
  // clearInterval(notiPopUpInterval)
})

socket.on('connection', (reason) => {
  console.log(reason)
  notiReqCallback()
  // notiInfoReqInterval = setInterval(notiReqCallback, 10000)
  notiPopUpInterval = setInterval(notiPopUpCallback, 5000)
})

socket.on('stop', (msg) => {
  console.log(msg)
  Swal.stopTimer()
  // clearInterval(notiInfoReqInterval)
  clearInterval(notiPopUpInterval)
})

socket.on('resume', (msg) => {
  console.log(msg)
  Swal.resumeTimer()
  // notiInfoReqInterval = setInterval(notiReqCallback, 10000)
  notiPopUpInterval = setInterval(notiPopUpCallback, 5000)
})

socket.on('orderList', (msg) => {
  if (typeof msg == 'string') {
    console.log(msg)
  } else if (typeof msg == 'object') {
    console.log('new Orders ' + msg.length)

    msg.forEach((element) => {
      list.push(element)
    })
  } else {
    return
  }
})

var displayNotification = () => {
  console.log('남은 알림 현재 : ' + list.length + '개 남음')
  var el = list.shift()

  Swal.fire({
    title: `<span class="nick">${el.nick}</span>님
    <span class="productName">${el.productName}</span> <span class="quantity">${el.quantity}</span>개
    구매 감사합니다
    <span class="point">${el.bj} ${el.point}</span>`,
    html: `<span class="msgText">${el.text}</span>`,
    timer: 5000,
    imageUrl: '/noti/image',
    imageHeight: 300,
    imageAlt: 'A image',
    color: '#716add',
    showConfirmButton: false,
    background: 'transparent',
    backdrop: `rgba(0,0,0,0.0)`,
    didOpen: async () => {
      notiText = el.text
      if (el.quantity == 1) {
        notiSound.src = `sounds/first.mp3`
      } else if (el.quantity >= 10) {
        notiSound.src = `sounds/third.mp3`
      } else if (el.quantity >= 5) {
        notiSound.src = `sounds/second.mp3`
      }
      notiSound.play()
      setTimeout(() => {
        new Audio('http://localhost:3000/tts/' + notiText).play()
      }, 2000)
    },
  }).then((result) => {
    if (result.dismiss === Swal.DismissReason.timer) {
      console.log('I was closed by the timer')
    }
  })
}
