var socket = io()
var list = []

var body = document.querySelector('#main .body')
socket.emit('scoreboard', new Date().getTime())

async function callback() {
  socket.emit('scoreboard', new Date().getTime())
}

socket.on('scoreboard', (msg) => {
  var html = ''
  for (var i in msg.result) {
    html += addListBar(msg.result[i], Number(i) + 1)
  }
  body.innerHTML = html
  document.querySelector('#totalCount').innerText = msg.total
})

socket.on('disconnect', (reason) => {
  clearInterval(boardInfoReqInterval)
})

/* socket.on('connection', (reason) => {
   boardInfoReqInterval = setInterval(callback, 10000)
}) */

function addListBar(data, rank) {
  var barImageFileName
  switch (rank) {
    case 1: {
      barImageFileName = 1
      break
    }
    case 2: {
      barImageFileName = 2
      break
    }
    case 3: {
      barImageFileName = 3
      break
    }
    case rank < 7: {
      barImageFileName = 'low'
      break
    }

    default:
      barImageFileName = 'normal'
      break
  }

  var el = `<div class="bar">
  <img src="images/listbar_${barImageFileName}.png" alt="" />
  <div class="barText menu">
    <span class="rank">${rank}</span>
    <span class="bj">${data.name}</span>
    <span class="score">${data.score}</span>
    <span class="contribute">${data.contribute}</span>
  </div>
</div>`

  return el
}
