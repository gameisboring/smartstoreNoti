'use strict'

const socket = io()
const list = new Array()
var notiInfoReqInterval = null
var notiPopUpInterval = null

async function notiReqCallback() {
  socket.emit('getOrderList')
}

socket.on('disconnect', function (reason) {
  clearInterval(notiInfoReqInterval)
  clearTimeout(notiPopUpInterval)
})

socket.on('connection', function (reason) {
  notiReqCallback()
  notiInfoReqInterval = setInterval(function () {
    socket.emit('getOrderList')
  }, 4000)

  notiPopUpInterval = setTimeout(tick, 100)
})

socket.on('stop', function (msg) {
  console.log(msg)
  Swal.stopTimer()

  clearInterval(notiInfoReqInterval)
  clearTimeout(notiPopUpInterval)
})

socket.on('resume', function (msg) {
  console.log(msg)
  Swal.resumeTimer()
  notiInfoReqInterval = setInterval(function () {
    socket.emit('getOrderList')
  }, 4000)

  notiPopUpInterval = setTimeout(tick, 100)
})

socket.on('orderList', function (msg) {
  if (typeof msg == 'string') {
  } else if (typeof msg == 'object') {
    if (msg.length >= 0) {
      msg.forEach(function (element) {
        list.push(element)
      })
    }
  } else {
    // TODO
    return
  }
})

async function tick() {
  console.log('남은 주문 : ' + list.length + '개')

  if (list.length > 0) {
    const el = list.shift()
    var notiSound = new Audio()

    var reqUrl = `http://nstream.kr:1322/${el.nick ? el.nick + '님' : ''}. ${
      el.productName ? el.productName : ''
    } ${el.quantity ? el.quantity + '개' : ''} 구매 감사합니다..
    ${el.bj ? el.bj : ''}${el.point ? el.point + '..' : ''} ${
      el.text ? el.text : ''
    }`

    await fetch('/config/tts')
      .then((response) => response.json())
      .then((data) => {
        if (
          Number(el.quantity) >= Number(data.FIRST_SOUND_UP) &&
          Number(el.quantity) <= Number(data.FIRST_SOUND_DOWN)
        ) {
          notiSound.src = `sounds/${data.FIRST_SOUND_FILE}`
        } else if (
          Number(el.quantity) >= Number(data.SECOND_SOUND_UP) &&
          Number(el.quantity) <= Number(data.SECOND_SOUND_DOWN)
        ) {
          notiSound.src = `sounds/${data.SECOND_SOUND_FILE}`
        } else if (Number(el.quantity) >= Number(data.THIRD_SOUND_UP)) {
          notiSound.src = `sounds/${data.THIRD_SOUND_FILE}`
        } else {
          return
        }

        reqUrl += '/' + data.SPEAKING_RATE + '/' + data.SPEAKING_VOICE
      })

    console.log(reqUrl)
    var notiTextToSpeach = new Audio(reqUrl)

    notiSound.load()
    notiTextToSpeach.load()

    notiSound.onloadedmetadata = function () {
      notiTextToSpeach.onloadedmetadata = function () {
        var timer =
          Math.floor(notiSound.duration * 1000) +
          Math.floor(notiTextToSpeach.duration * 1000) +
          2000
        notiPopUpInterval = setTimeout(tick, timer)

        Swal.fire({
          title: `<span class="nick">${el.nick}</span>님
        <span class="productName">${
          el.productName
        }</span> <span class="quantity">${el.quantity}</span>개
        구매 감사합니다
        ${el.bj ? '<span class="point">' + el.bj + '</span>' : ''} ${
            el.point ? '<span class="point">' + el.point + '</span>' : ''
          } `,
          html: `<span class="msgText">${el.text}</span>`,
          timer: timer,
          // timerProgressBar: true,
          imageUrl: '/images/noti.png',
          imageHeight: 300,
          imageAlt: 'A image',
          color: '#716add',
          showConfirmButton: false,
          background: 'transparent',
          backdrop: `rgba(0,0,0,0.0)`,
          didOpen: async () => {
            notiSound.play()
            var setTimeoutID = setTimeout(() => {
              notiTextToSpeach.play()
              clearTimeout(setTimeoutID)
            }, 2000)
          },
        }).then((result) => {
          if (result.dismiss === Swal.DismissReason.timer) {
            console.log('I was closed by the timer')
          }
        })
      }
    }
  } else {
    notiPopUpInterval = setTimeout(tick, 1000)
  }
}
