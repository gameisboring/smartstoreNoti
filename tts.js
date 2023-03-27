// Imports the Google Cloud client library
const { TextToSpeechClient } = require('@google-cloud/text-to-speech')
const path = require('path')

// Import other required libraries
const fs = require('fs')
const util = require('util')
// Creates a client
const client = new TextToSpeechClient({
  keyFilename: path.join(process.resourcesPath, '/public/tts-api-account.json'),
})
async function quickStart(text, speakingRate, speakingVoice) {
  // Construct the request
  const request = {
    input: { text: text },
    // Select the language and SSML voice gender (optional)
    voice: {
      languageCode: 'ko-KR',
      name: speakingVoice,
    },
    // select the type of audio encoding
    audioConfig: { audioEncoding: 'MP3', speakingRate: Number(speakingRate) },
  }

  // Performs the text-to-speech request
  const [response] = await client.synthesizeSpeech(request)
  // Write the binary audio content to a local file
  const writeFile = util.promisify(fs.writeFile)
  await writeFile(
    path.join(process.resourcesPath, '/public/output.mp3'),
    response.audioContent,
    'binary'
  )
}
module.exports = { quickStart }
