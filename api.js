const bcrypt = require('bcrypt')
const http = require('https')
const axios = require('axios').default
const API = require('./config/ApiConfig.json')
const clientId = API.CLIENT_ID
const clientSecret = API.CLIENT_SECRET
const timestamp = new Date().getTime() - 1000
const password = `${clientId}_${timestamp}`
const { createhashedSign } = require('./hash')

const clientSecretSign = createhashedSign(password, clientSecret)

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
          console.log('getOauthTokenToAxios', error)
          resolve(false)
        })
    })
  }

  /**
   * Get Changed Product Order Details
   * @returns (JSON) Changed Statuses
   */
  async getChangeList() {
    const oauthToken = await this.getOauthTokenToAxios()
    const nowTime = API.DATE ? API.DATE : new Date().toString()
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
          lastChangedFrom: new Date(nowTime).toString(),
        },
      })
        .then(function (response) {
          // const mappedData = response.data.data.lastChangeStatuses
          const mappedData = response.data.data.lastChangeStatuses.map(
            (change) => change.productOrderId
          )
          resolve(mappedData)
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
