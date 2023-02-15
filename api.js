const bcrypt = require('bcrypt')
const http = require('https')
const axios = require('axios').default
const API = require('./config/ApiConfig.json')

const clientId = API.CLIENT_ID
const clientSecret = API.CLIENT_SECRET
const timestamp = new Date().getTime() - 1000

// 밑줄로 연결하여 password 생성
const password = `${clientId}_${timestamp}`
// bcrypt 해싱
const hashed = bcrypt.hashSync(password, clientSecret)
// base64 인코딩
const clientSecretSign = Buffer.from(hashed, 'utf-8').toString('base64')

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
          timestamp: timestamp,
          client_secret_sign: clientSecretSign,
          grant_type: 'client_credentials',
          type: 'SELF',
          account_id: 'nfun00',
        },
      })
        .then(function (response) {
          resolve(response.data.access_token)
        })
        .catch(function (error) {
          reject(error)
        })
    })
  }

  /**
   * Get Changed Product Order Details
   * @returns (JSON) Changed Statuses
   */
  async getChangeList() {
    const oauthToken = await this.getOauthTokenToAxios()
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
          lastChangedFrom: new Date('2023-01-27 00:00:00').toString(),
        },
      }).then(function (response) {
        const mappedData = response.data.data.lastChangeStatuses.map(
          (change) => change.productOrderId
        )
        resolve(mappedData)
      })
    })
  }

  /**
   * 주문 내역 조회
   */
  async getOrderList() {
    const orderList = await this.getChangeList()
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
      }).then(function (response) {
        console.log(response.data)
        resolve(response.data)
      })
    })
  }

  /**
   * 사용안함
   */
  async getSellerChannelInfo() {
    const productsList = await this.getProductList()
    var arr = new Array()
    for (var i in productsList) {
      arr.push(productsList[i].channelProducts)
    }
  }
}
