// Load the SDK and UUID
var AWS = require('aws-sdk')
var fs = require('fs')

var key = require('./key.json')

AWS.config.update({
  accessKeyId: key.access_key,
  secretAccessKey: key.secret_access_key,
  region: 'ap-northeast-2',
})

const Polly = new AWS.Polly({
  signatureVersion: 'v2',
  region: 'ap-northeast-2',
})

module.exports = { Polly }

/* let params = {
  Text: '반가워 112친구야~',
  OutputFormat: 'mp3',
  VoiceId: 'Seoyeon',
}

Polly.synthesizeSpeech(params, (err, data) => {
  if (err) {
    console.log(err.code)
  } else if (data) {
    if (data.AudioStream instanceof Buffer) {
      fs.writeFile('./speech.mp3', data.AudioStream, function (err) {
        if (err) {
          return console.log(err)
        }
        console.log('The file was saved!')
      })
    }
  }
}) */
