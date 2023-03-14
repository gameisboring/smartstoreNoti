// Imports the Google Cloud client library
const textToSpeech = require('@google-cloud/text-to-speech')

// Import other required libraries
const fs = require('fs')
const util = require('util')
// Creates a client
const client = new textToSpeech.TextToSpeechClient()
async function quickStart(text) {
  // Construct the request
  const request = {
    input: { text: text },
    // Select the language and SSML voice gender (optional)
    voice: { languageCode: 'ko-KR', ssmlGender: 'PLAIN' },
    // select the type of audio encoding
    audioConfig: { audioEncoding: 'MP3' },
  }

  // Performs the text-to-speech request
  const [response] = await client.synthesizeSpeech(request)
  // Write the binary audio content to a local file
  const writeFile = util.promisify(fs.writeFile)
  await writeFile(
    process.resourcesPath + '/output.mp3',
    response.audioContent,
    'binary'
  )
  console.log('Audio content written to file: output.mp3')
}
module.exports = { quickStart }
