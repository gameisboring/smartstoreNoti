var socket = io()
var list = []
var notiInfoReqInterval
var notiPopUpInterval
var notiSound = document.querySelector('#notiSound')
var notiTextToSpeach = document.querySelector('#notiTextToSpeach')
var notiTime
notiSound.load()
notiTextToSpeach.load()

/* document.querySelector('#start').addEventListener('click', (event) => {
  event.preventDefault()
  document.querySelector('#start').style.display = 'none'
}) */

async function notiReqCallback() {
  console.log('noti information request function')
  socket.emit('orderList')
}

async function notiPopUpCallback() {
  console.log('noti PopUp function')
  if (list.length > 0) {
    displayNotification()
  }
}

socket.on('disconnect', (reason) => {
  console.log(reason)
  clearInterval(notiInfoReqInterval)
  clearInterval(notiPopUpInterval)
})

socket.on('connection', (reason) => {
  console.log(reason)
  notiReqCallback()
  notiInfoReqInterval = setInterval(notiReqCallback, 10000)
  notiPopUpInterval = setInterval(notiPopUpCallback, 7000)
})

socket.on('stop', (msg) => {
  console.log(msg)
  Swal.stopTimer()

  clearInterval(notiInfoReqInterval)
  clearInterval(notiPopUpInterval)
})

socket.on('resume', (msg) => {
  console.log(msg)
  Swal.resumeTimer()
  notiInfoReqInterval = setInterval(notiReqCallback, 10000)
  notiPopUpInterval = setInterval(notiPopUpCallback, 7000)
})

socket.on('orderList', (msg) => {
  if (typeof msg == 'string') {
    console.log(msg)
  } else if (typeof msg == 'object') {
    console.log(msg)
    console.log('new Orders ' + msg.length)
    if (msg.length >= 0) {
      msg.forEach((element) => {
        list.push(element)
      })
    }
  } else {
    // TODO
    return
  }
})

var displayNotification = () => {
  console.log('남은 알림 현재 : ' + list.length + '개 남음')
  var el = list.shift()
  var time = 0
  if (el.quantity == 1) {
    notiSound.src = `sounds/first.mp3`
  } else if (el.quantity >= 10) {
    notiSound.src = `sounds/third.mp3`
  } else if (el.quantity >= 5) {
    notiSound.src = `sounds/second.mp3`
  }
  notiTextToSpeach = new Audio('http://nstream.kr:1322/' + el.text)
  notiSound.load()
  notiTextToSpeach.load()

  notiSound.onloadedmetadata = function () {
    var soundDur = Math.floor(notiSound.duration * 1000)

    notiTextToSpeach.onloadedmetadata = function () {
      var ttsDur = Math.floor(notiTextToSpeach.duration * 1000) + 2000

      console.log('soundDur', soundDur)
      console.log('ttsDur', ttsDur)
      console.log('time', soundDur + ttsDur + 2000)
      Swal.fire({
        title: `<span class="nick">${el.nick}</span>님
      <span class="productName">${el.productName}</span> <span class="quantity">${el.quantity}</span>개
      구매 감사합니다
      <span class="point">${el.bj} ${el.point}</span>`,
        html: `<span class="msgText">${el.text}</span>`,
        timer: soundDur + ttsDur + 2000,
        // timerProgressBar: true,
        imageUrl: '/noti/image',
        imageHeight: 300,
        imageAlt: 'A image',
        color: '#716add',
        showConfirmButton: false,
        background: 'transparent',
        backdrop: `rgba(0,0,0,0.0)`,
        didOpen: async () => {
          notiSound.play()
          setTimeout(() => {
            notiTextToSpeach.play()
          }, 2000)

          time = 0
        },
      }).then((result) => {
        if (result.dismiss === Swal.DismissReason.timer) {
          console.log('I was closed by the timer')
        }
      })
    }
  }
}
