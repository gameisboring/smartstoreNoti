var socket = io()
var list = []
var boardInfoReqInterval

var body = document.querySelector('#main .body')
socket.emit('getScoreboard', new Date().getTime())

async function callback() {
  socket.emit('getScoreboard', new Date().getTime())
}

socket.on('scoreboard', (msg) => {
  var html = ''
  var total = 0
  for (var i in msg.result) {
    if (msg.result[i].name != '') {
      html += addListBar(msg.result[i], Number(i) + 1)
      total += msg.result[i].quantity
    }
  }
  body.innerHTML = html
  document.querySelector('#totalCount').innerText = total
})

socket.on('disconnect', (reason) => {
  clearInterval(boardInfoReqInterval)
})

socket.on('connection', (reason) => {
  boardInfoReqInterval = setInterval(callback, 10000)
})

function addListBar(data, rank) {
  var barImageFileName
  if (rank == 1) {
    barImageFileName = 1
  } else if (rank == 2) {
    barImageFileName = 2
  } else if (rank == 3) {
    barImageFileName = 3
  } else if (rank > 9) {
    barImageFileName = 'low'
  } else {
    barImageFileName = 'normal'
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
