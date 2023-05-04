'use strict'

const socket = io()
const list = new Array()
var notiInfoReqInterval = null
var notiPopUpInterval = null

async function notiReqCallback() {
  socket.emit('getOrderList', new Date().toLocaleTimeString())
}

socket.on('disconnect', function (reason) {
  clearInterval(notiInfoReqInterval)
  clearTimeout(notiPopUpInterval)
})

socket.on('connection', function (reason) {
  notiReqCallback()
  notiInfoReqInterval = setInterval(function () {
    socket.emit('getOrderList', new Date().toLocaleTimeString())
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
    socket.emit('getOrderList', new Date().toLocaleTimeString())
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
function tssDialogGen(data, script) {
  var reqUrl = script
  Object.keys(data).forEach(function (key) {
    reqUrl = reqUrl.replace('[' + key + ']', data[key])
  })
  return reqUrl
}

function alertTextGen(data, script) {
  var text = script.replace(/\./g, ' ')
  Object.keys(data).forEach(function (key) {
    if (key == 'text' || key == 'bj' || key == 'productName') {
      text = text.replace(
        '[' + key + ']',
        `<br><span class="${key}">${data[key]}</span>`
      )
    } else {
      text = text.replace(
        '[' + key + ']',
        `<span class="${key}">${data[key]}</span>`
      )
    }
  })
  return text
}

async function tick() {
  console.log('남은 주문 : ' + list.length + '개')

  if (list.length > 0) {
    const el = list.shift()
    var notiSound = new Audio()
    var notiText = ''
    var reqUrl = 'http://nstream.kr:1322/'
    await fetch('/config/tts')
      .then((response) => response.json())
      .then(async (data) => {
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
        notiText = await alertTextGen(el, data.DIALOG_FORM)
        reqUrl += await tssDialogGen(el, data.DIALOG_FORM)
        reqUrl += '/' + data.SPEAKING_RATE + '/' + data.SPEAKING_VOICE
      })

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
          title: notiText,
          timer: timer,
          // timerProgressBar: true,
          imageUrl: '/images/noti.png',
          imageAlt: 'A image',
          showConfirmButton: false,
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
          }
        })
      }
    }
  } else {
    notiPopUpInterval = setTimeout(tick, 1000)
  }
}
