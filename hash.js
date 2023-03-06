const bcrypt = require('bcrypt')
// 밑줄로 연결하여 password 생성

// bcrypt 해싱
async function createhashedSign(password, clientSecret) {
  let hashed
  try {
    hashed = await bcrypt.hash(password, clientSecret)
  } catch (error) {
    console.error('Hashed', error)
    hashed = false
  }

  if (typeof hashed === 'string') {
    return Buffer.from(hashed, 'utf-8').toString('base64')
  } else {
    return hashed
  }
}

module.exports = { createhashedSign }
