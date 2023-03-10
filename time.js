function dateFormat(date) {
  let month = date.getMonth() + 1
  let day = date.getDate()

  month = month >= 10 ? month : '0' + month
  day = day >= 10 ? day : '0' + day

  return date.getFullYear() + '-' + month + '-' + day
}

function timeFormat(date) {
  let hour = date.getHours()
  let min = date.getMinutes()
  let sec = date.getSeconds()

  return `${hour}:${min}:${sec}`
}

function fourHoursAgo() {
  return new Date(new Date().getTime() - 14400000)
}

module.exports = { dateFormat, timeFormat, fourHoursAgo }
