const bcrypt = require('bcrypt')
const http = require('https')
const fs = require('fs')
const axios = require('axios').default
const API = require('./config/ApiConfig.json')
// const API = JSON.parse(fs.readFileSync('./config/ApiConfig.json', 'utf-8'))
const { createhashedSign } = require('./hash')
const clientId = API.CLIENT_ID
const clientSecret = API.CLIENT_SECRET
const password = `${clientId}_${new Date().getTime() - 5000}`
const clientSecretSign = createhashedSign(password, clientSecret)

const listFileName = `${dateFormat(new Date())}_list.json`
let listFileUrl = `./config/${listFileName}`

try {
  fs.readFileSync(listFileUrl)
} catch (error) {
  const data = []
  console.error(
    `There no  ${listFileName} file. create new file ${listFileName}`
  )
  fs.writeFileSync(listFileUrl, JSON.stringify(data)) // 파일 생성
}

const orderedList = require(listFileUrl)

function dateFormat(date) {
  let month = date.getMonth() + 1
  let day = date.getDate()

  month = month >= 10 ? month : '0' + month
  day = day >= 10 ? day : '0' + day

  return date.getFullYear() + '-' + month + '-' + day
}

module.exports = class ApiControls {
  /**
   * Get Access Token from NaverCommerce API Center with Axios
   * @returns (String) access_token
   */
  async getOauthTokenToAxios() {
    return new Promise((resolve, reject) => {
      axios({
        method: 'post',
        url: '/external/v1/oauth2/token',
        baseURL: 'https://api.commerce.naver.com',
        headers: 'application/x-www-form-urlencoded',
        params: {
          client_id: clientId,
          timestamp: new Date().getTime() - 5000,
          client_secret_sign: clientSecretSign,
          grant_type: 'client_credentials',
          type: 'SELF',
          account_id: 'nfun00',
        },
      })
        .then(function (response) {
          console.log(response.data.expires_in)
          resolve(response.data.access_token)
        })
        .catch(function (error) {
          console.log('getOauthTokenToAxios', error)
          resolve(false)
        })
    })
  }

  /**
   * Compare to Existing Order List
   */
  async compareExOrderList(mappedData) {
    let newOrders = []

    for (var i in mappedData) {
      var result = orderedList.filter((order) => order.orderId == mappedData[i])
      // console.log(mappedData[i], result.length == 0)

      // 이전 기록과 비교해서 겹치는 게 없을 때
      if (result.length == 0) {
        console.log('::::: New Payment Detected!!!!', mappedData[i])
        const result = orderedList.push({
          no: orderedList.length,
          orderId: mappedData[i],
        })
        console.log(result > 0)
        fs.writeFileSync(listFileUrl, JSON.stringify(orderedList))
        newOrders.push(mappedData[i])
      }
    }
    return newOrders
  }

  /**
   * Get Changed Product Order Details
   * @returns (JSON) Changed Statuses
   */
  async getChangeList() {
    const oauthToken = await this.getOauthTokenToAxios()
    const check = this.compareExOrderList

    if (!oauthToken) {
      return false
    }
    return new Promise((resolve, reject) => {
      axios({
        method: 'get',
        url: '/external/v1/pay-order/seller/product-orders/last-changed-statuses',
        baseURL: 'https://api.commerce.naver.com',
        headers: {
          Authorization: oauthToken,
          'content-type': 'application/json',
        },
        params: {
          lastChangedFrom: new Date(new Date().getTime() - 5000),
          lastChangedType: 'PAYED',
        },
      })
        .then(function (response) {
          var chekcData = response.data.hasOwnProperty('data')
          if (chekcData) {
            const mappedData = response.data.data.lastChangeStatuses.map(
              (change) => change.productOrderId
            )
            resolve(check(mappedData))
          } else {
            resolve(response.data)
          }
          // const mappedData = response.data.data.lastChangeStatuses
        })
        .catch(function (error) {
          console.error('getChangeList', error)
          resolve(false)
        })
    })
  }

  /**
   * get Order List
   */
  async getOrderList() {
    const orderList = await this.getChangeList()
    if (orderList.length == 0) {
      return 'There are no new orders.'
    } else if (
      orderList.hasOwnProperty('traceId') &&
      orderList.hasOwnProperty('timestamp')
    ) {
      return 'There are no orders.'
    }
    const oauthToken = await this.getOauthTokenToAxios()
    return new Promise((resolve, reject) => {
      axios({
        method: 'post',
        url: '/external/v1/pay-order/seller/product-orders/query',
        baseURL: 'https://api.commerce.naver.com',
        headers: {
          Authorization: oauthToken,
          'content-type': 'application/json',
        },
        data: {
          productOrderIds: orderList,
        },
      })
        .then(function (response) {
          const mappedData = response.data.data.map((productOrder) => {
            const options = productOrder.productOrder.productOption.split('/')
            return {
              nick: options[0].split(API.NICK_OPT + ': ')[1],
              text: options[1].split(API.TEXT_OPT + ': ')[1],
              streamerName: productOrder.productOrder.productName
                .match(/\[(.*?)\]/g)
                .map((match) => match.slice(1, -1))[0],
              productName: productOrder.productOrder.productName,
            }
          })
          resolve(mappedData)
        })
        .catch(function (error) {
          console.error('getChangeList', error)
          resolve(error)
        })
    })
  }

  /**
   * NO Use
   */
  async getSellerChannelInfo() {
    const productsList = await this.getProductList()
    var arr = new Array()
    for (var i in productsList) {
      arr.push(productsList[i].channelProducts)
    }
  }
}
