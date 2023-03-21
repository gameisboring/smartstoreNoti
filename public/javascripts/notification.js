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
  }, 10000)

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
  }, 10000)

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
  const ttsConfig = await fetch('/config/tts')
    .then((response) => response.json())
    .then((data) => {
      return data
    })
  if (list.length > 0) {
    const el = list.shift()

    var notiSound = new Audio()
    var notiTextToSpeach = new Audio(
      `http://nstream.kr:1322/` +
        `${el.nick}님. ${el.productName} ${el.quantity}개 구매 감사합니다..
        ${el.bj ? el.bj : ''} ${el.point ? el.point : ''}..${el.text}`
    )

    if (el.quantity >= 1 && el.quantity < 5) {
      notiSound.src = `sounds/${ttsConfig.FIRST_SOUND_FILE}`
    } else if (el.quantity >= 5 && el.quantity < 10) {
      notiSound.src = `sounds/${ttsConfig.SECOND_SOUND_FILE}`
    } else if (el.quantity >= 10) {
      notiSound.src = `sounds/${ttsConfig.THIRD_SOUND_FILE}`
    } else {
      return
    }

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
