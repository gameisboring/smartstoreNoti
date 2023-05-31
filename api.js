'use strict'

const fsPromises = require('fs').promises
const fs = require('fs')
const axios = require('axios').default
const { io } = require('./server')
const log = require('electron-log')
const path = require('path')
const { createhashedSign } = require('./hash')
const { dateFormat, hoursAgo } = require('./time')

//  appdata/roaming/projectName
let listFolderUrl = process.resourcesPath + '/list'
module.exports = class ApiControls {
  /**
   * Get Access Token from NaverCommerce API Center with Axios
   * @returns (String) access_token
   */
  async getOauthTokenToAxios() {
    const API = await JSON.parse(
      await fsPromises.readFile(process.resourcesPath + '/APIconfig.json')
    )
    return new Promise(async (resolve, reject) => {
      await axios({
        method: 'post',
        url: '/external/v1/oauth2/token',
        baseURL: 'https://api.commerce.naver.com',
        headers: 'application/x-www-form-urlencoded',
        params: {
          client_id: API.CLIENT_ID,
          timestamp: new Date().getTime() - 3000,
          client_secret_sign: await createhashedSign(
            `${API.CLIENT_ID}_${new Date().getTime() - 3000}`,
            API.CLIENT_SECRET
          ),
          grant_type: 'client_credentials',
          type: 'SELF',
          account_id: API.ACCOUNT_ID,
        },
      })
        .then(function (response) {
          resolve(response.data.access_token)
        })
        .catch(function (error) {
          log.error('getOauthTokenToAxios', error.response.data)
          log.error('server time', new Date().getTime() - 3000)
          resolve(false)
        })
    })
  }

  /**
   * Compare to Existing Order List
   */
  async compareExOrderList(mappedData) {
    const API = await JSON.parse(
      await fsPromises.readFile(process.resourcesPath + '/APIconfig.json')
    )

    // 클래스 객체
    let apiControls = new ApiControls()
    // 2023-01-01_list.json
    let listFileName = await apiControls.getNewestList('_list.json')
    let pointListFileName = await apiControls.getNewestList('_pointList.json')
    // 새로운 주문 넣을 빈 배열
    let notiOrders = []

    // 기존에 작성되어있는 Array 타입 JSON 파일
    let orderedList = JSON.parse(
      await fsPromises.readFile(`${listFolderUrl}/${listFileName}`, 'utf-8')
    )

    let pointList = JSON.parse(
      await fsPromises.readFile(
        `${listFolderUrl}/${pointListFileName}`,
        'utf-8'
      )
    )

    // 파라미터로 넘어온 데이터 순회하며 중복조회
    for (var i in mappedData) {
      var result = orderedList.filter(
        // productOrderId 중복이면 필터링
        (order) => order.productOrderId == mappedData[i].productOrderId
      )

      // 이전 기록과 비교해서 겹치는 게 없을 때(필터링 된 데이터 없음)
      if (result.length == 0) {
        if (API.SALE_EVENT_CHECK) {
          // 판매 이벤트 진행중
          if (mappedData[i].productId == API.SALE_EVENT_PRODUCT_ID) {
            // 판매 이벤트 진행중 & 상품 코드 일치
            log.info(
              `[새로운 주문] 주문번호:${mappedData[i].productOrderId} | 상품:${
                mappedData[i].productName
              } | 수량: ${mappedData[i].quantity}ea | 구매자: ${
                mappedData[i].nick
              }${mappedData[i].bj ? ' | BJ포인트: ' + mappedData[i].bj : ''}${
                mappedData[i].point ? mappedData[i].point : ''
              } | 판매 이벤트 참여 : 참여`
            )

            // 구매 알림리스트에 추가
            notiOrders.push(mappedData[i])
          } else {
            // 판매 이벤트 진행중 & 상품 코드 불일치
            log.info(
              `[새로운 주문] 주문번호:${mappedData[i].productOrderId} | 상품:${
                mappedData[i].productName
              } | 수량: ${mappedData[i].quantity}ea | 구매자: ${
                mappedData[i].nick
              }${mappedData[i].bj ? ' | BJ포인트: ' + mappedData[i].bj : ''}${
                mappedData[i].point ? mappedData[i].point : ''
              } | 판매 이벤트 참여 : 참여 안함`
            )
          }

          orderedList.push({
            no: orderedList.length,
            productOrderId: mappedData[i].productOrderId,
            productId: mappedData[i].productId,
            presentSaleEvent:
              mappedData[i].productId == API.SALE_EVENT_PRODUCT_ID,
            quantity: mappedData[i].quantity,
          })
        } else {
          orderedList.push({
            no: orderedList.length,
            productOrderId: mappedData[i].productOrderId,
            productId: mappedData[i].productId,
            presentSaleEvent: API.SALE_EVENT_CHECK,
            quantity: mappedData[i].quantity,
          })

          // 판매 이벤트 진행 안함
          log.info(
            `[새로운 주문] 주문번호:${mappedData[i].productOrderId} | 상품:${
              mappedData[i].productName
            } | 수량: ${mappedData[i].quantity}ea | 구매자: ${
              mappedData[i].nick
            }${mappedData[i].bj ? ' | BJ포인트: ' + mappedData[i].bj : ''}${
              mappedData[i].point ? mappedData[i].point : ''
            } | 판매 이벤트 참여 : 참여 안함`
          )
        }

        if (mappedData[i].bj && mappedData[i].point) {
          notiOrders.push(mappedData[i])
        }

        pointList.push({
          no: pointList.length,
          nick: mappedData[i].nick,
          productOrderId: mappedData[i].productOrderId,
          productId: mappedData[i].productId,
          bj: mappedData[i].bj ? mappedData[i].bj : '',
          point: mappedData[i].point ? mappedData[i].point : '',
          orderDate: mappedData[i].date,
          quantity: mappedData[i].quantity,
          price: mappedData[i].price,
        })
      }
    }

    // 리스트 파일로 저장
    await fsPromises.writeFile(
      `${listFolderUrl}/${listFileName}`,
      JSON.stringify(orderedList)
    )
    await fsPromises.writeFile(
      `${listFolderUrl}/${pointListFileName}`,
      JSON.stringify(pointList)
    )
    // 순회 마치고 새롭게 추가된 데이터 반환
    io.emit('orderList', notiOrders)

    // return notiOrders
    return true
  }

  /**
   * Get Changed Product Order Details
   * @returns (JSON) Changed Statuses
   */
  async getChangeList() {
    const oauthToken = await this.getOauthTokenToAxios()
    const { SALE_EVENT_CHECK } = await JSON.parse(
      await fsPromises.readFile(process.resourcesPath + '/APIconfig.json')
    )
    if (!oauthToken) {
      return false
    }

    return new Promise((resolve, reject) => {
      async function getMore(moreFrom, moreSequence) {
        return await axios({
          method: 'get',
          url: '/external/v1/pay-order/seller/product-orders/last-changed-statuses',
          baseURL: 'https://api.commerce.naver.com',
          headers: {
            Authorization: oauthToken,
            'content-type': 'application/json',
          },
          params: {
            lastChangedFrom: moreFrom,
            moreSequence: moreSequence,
          },
        })
      }

      axios({
        method: 'get',
        url: '/external/v1/pay-order/seller/product-orders/last-changed-statuses',
        baseURL: 'https://api.commerce.naver.com',
        headers: {
          Authorization: oauthToken,
          'content-type': 'application/json',
        },
        params: {
          // lastChangedFrom: new Date('2023-05-31'),
          lastChangedFrom: new Date(
            new Date().getTime() - (SALE_EVENT_CHECK ? 10000 : 180000)
          ),
        },
      })
        .then(async function (response) {
          var chekcData = response.data.hasOwnProperty('data')
          if (chekcData) {
            let mappedData = response.data.data.lastChangeStatuses.map(
              (change) => change.productOrderId
            )
            if (response.data.data.hasOwnProperty('more')) {
              var more = await getMore(
                response.data.data.more.moreFrom,
                response.data.data.more.moreSequence
              ).then(async function (response) {
                let mappedData = response.data.data.lastChangeStatuses.map(
                  (change) => change.productOrderId
                )
                return mappedData
              })
              mappedData = mappedData.concat(more)
            }
            resolve(mappedData)
          } else {
            resolve(response.data)
          }
        })
        .catch(function (error) {
          log.error('getChangeList', error.response)
          resolve(false)
        })
    })
  }

  /**
   * get Order List
   */
  async getOrderList() {
    const API = await JSON.parse(
      await fsPromises.readFile(process.resourcesPath + '/APIconfig.json')
    )
    const RegexObj = {
      nick: new RegExp(`(?<=${API.NICK_OPT}: )(.*?)(?= \/)`),
      text: new RegExp(`(?<=${API.TEXT_OPT}: )(.*?)(?= \/)`),
      size: new RegExp(`(?<=${API.SIZE_OPT}: )(.*?)(?= \/)`),
      bj: new RegExp(`(?<=${API.BJ_OPT}: )(.*?)(?= \/)`),
      point: new RegExp(`(?<=${API.POINT_OPT}: )(.*?)(?= \/)`),
    }
    const orderList = await this.getChangeList()
    const { compareExOrderList } = this
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
          var orders
          // BJ 점수 표시(발주확인건 집계) 체크여부
          if (API.SHOW_BJ_POINT) {
            orders = response.data.data.filter(function (productOrder) {
              for (var i in API.PRODUCT_ID) {
                if (productOrder.productOrder.productId == API.PRODUCT_ID[i]) {
                  if (
                    productOrder.productOrder.hasOwnProperty('placeOrderDate')
                  ) {
                    return true
                  }
                }
              }
              {
                return false
              }
            })

            orders = orders.map(function (productOrder) {
              const options = productOrder.productOrder.productOption + ' /'
              return {
                productOrderId: productOrder.productOrder.productOrderId,
                productId: productOrder.productOrder.productId,
                quantity: productOrder.productOrder.quantity,
                price: productOrder.productOrder.totalPaymentAmount,
                nick: options.match(RegexObj.nick)
                  ? options.match(RegexObj.nick)[0]
                  : '',
                text: options.match(RegexObj.text)
                  ? options.match(RegexObj.text)[0]
                  : '',
                size: options.match(RegexObj.size)
                  ? options.match(RegexObj.size)[0]
                  : '',
                bj: options.match(RegexObj.bj)
                  ? options.match(RegexObj.bj)[0]
                  : '',
                point: options.match(RegexObj.point)
                  ? options.match(RegexObj.point)[0]
                  : '',
                productName:
                  productOrder.productOrder.productName.split(']')[1],
                date: productOrder.order.paymentDate,
              }
            })
          } else {
            orders = response.data.data.filter(function (productOrder) {
              for (var i in API.PRODUCT_ID) {
                if (productOrder.productOrder.productId == API.PRODUCT_ID[i]) {
                  return true
                }
              }
              return false
            })
            orders = orders.map(function (productOrder) {
              const options = productOrder.productOrder.productOption + ' /'
              return {
                productOrderId: productOrder.productOrder.productOrderId,
                productId: productOrder.productOrder.productId,
                quantity: productOrder.productOrder.quantity,
                nick: options.match(RegexObj.nick)
                  ? options.match(RegexObj.nick)[0]
                  : '',
                text: options.match(RegexObj.text)
                  ? options.match(RegexObj.text)[0]
                  : '',
                size: options.match(RegexObj.size)
                  ? options.match(RegexObj.size)[0]
                  : '',
                productName:
                  productOrder.productOrder.productName.split(']')[1],
                date: productOrder.order.paymentDate,
              }
            })
          }
          resolve(compareExOrderList(orders))
        })
        .catch(function (error) {
          log.error('getOrderList', error.response.data)
          resolve(error)
        })
    })
  }

  async getScoreList() {
    let pointList = JSON.parse(
      await fsPromises.readFile(
        `${listFolderUrl}/${await this.getNewestList('pointList.json')}`,
        'utf-8'
      )
    )
    let scoreResult = new Object({ total: 0 })
    for (var i in pointList) {
      if (pointList[i].hasOwnProperty('bj')) {
        if (!scoreResult.hasOwnProperty(pointList[i].bj)) {
          scoreResult[pointList[i].bj] = {
            plus: 0,
            minus: 0,
            contribute: 0,
            quantity: 0,
          }
        }

        if (pointList[i].point == '플러스') {
          scoreResult[pointList[i].bj].plus += pointList[i].price
        } else if (pointList[i].point == '마이너스') {
          scoreResult[pointList[i].bj].minus += pointList[i].price
        }
        scoreResult[pointList[i].bj].contribute += pointList[i].price
        scoreResult[pointList[i].bj].quantity += pointList[i].quantity
        scoreResult.total += pointList[i].quantity
      }
    }
    return scoreResult
  }

  async getCountForAdmin() {
    let counterResult = new Object({ TotalOrders: 0 })
    const API = await JSON.parse(
      await fsPromises.readFile(process.resourcesPath + '/APIconfig.json')
    )
    let orderList = JSON.parse(
      await fsPromises.readFile(
        `${listFolderUrl}/${await this.getNewestList('list.json')}`,
        'utf-8'
      )
    )

    orderList.forEach((element) => {
      counterResult.TotalOrders += element.quantity
      if (!counterResult.hasOwnProperty(element.productId)) {
        counterResult[element.productId] = { TotalCount: 0, PreCount: 0 }
      }
      counterResult[element.productId].TotalCount += element.quantity
      if (API.SALE_EVENT_CHECK) {
        if (API.SALE_EVENT_PRODUCT_ID == element.productId) {
          counterResult[element.productId].PreCount += element.quantity
        }
      }
    })
    return counterResult
  }

  async getCountForClient() {
    let counterObj = new Object({ TotalCount: 0, PreCount: 0 })

    const API = await JSON.parse(
      await fsPromises.readFile(process.resourcesPath + '/APIconfig.json')
    )

    let orderList = JSON.parse(
      await fsPromises.readFile(
        `${listFolderUrl}/${await this.getNewestList('list.json')}`,
        'utf-8'
      )
    )

    orderList.forEach((element) => {
      counterObj.TotalCount += element.quantity
      if (API.SALE_EVENT_PRODUCT_ID) {
        if (API.SALE_EVENT_PRODUCT_ID == element.productId) {
          counterObj.PreCount += element.quantity
        }
      }
    })

    return counterObj
  }

  async scoreBoardToUsableData() {
    let scoreboard = await this.getScoreList()
    // 주문건수만 먹고 버리기
    let total = Number(scoreboard.total)
    delete scoreboard.total

    let result = new Array()

    for (var i in Object.keys(scoreboard)) {
      const score =
        scoreboard[Object.keys(scoreboard)[i]].plus -
        scoreboard[Object.keys(scoreboard)[i]].minus
      const quantity = scoreboard[Object.keys(scoreboard)[i]].quantity
      const coutribute = scoreboard[Object.keys(scoreboard)[i]].contribute
      var newObj = {
        name: Object.keys(scoreboard)[i],
        score: score,
        contribute: coutribute,
        quantity: quantity,
      }

      result.push(newObj)
    }

    result.sort(function (a, b) {
      if (a.contribute > b.contribute) return -1
      if (a.contribute < b.contribute) return 1
      return 0
    })

    for (var i in result) {
      result[i].rank = ++i
    }

    return { result, total }
  }

  async scoreBoardResult() {
    let scoreboard = await this.getScoreList()
    // 주문건수만 먹고 버리기
    let total = Number(scoreboard.total)
    delete scoreboard.total

    let result = new Array()

    for (var i in Object.keys(scoreboard)) {
      const score =
        scoreboard[Object.keys(scoreboard)[i]].plus -
        scoreboard[Object.keys(scoreboard)[i]].minus
      const contribute = scoreboard[Object.keys(scoreboard)[i]].contribute
      const quantity = scoreboard[Object.keys(scoreboard)[i]].quantity
      var newObj = {
        이름: Object.keys(scoreboard)[i],
        점수: score,
        기여도: contribute,
        판매수량: quantity,
      }
      result.push(newObj)
    }

    result.sort(function (a, b) {
      if (a.점수 > b.점수) return -1
      if (a.점수 < b.점수) return 1
      if (a.기여도 > b.기여도) return -1
      if (a.기여도 < b.기여도) return 1
      return 0
    })

    for (var i in result) {
      result[i].rank = ++i
    }

    return { 결과: result, '총 판매수량': total }
  }

  async getNewestList(keyWord) {
    return new Promise(async (resolve, reject) => {
      await fsPromises.readdir(listFolderUrl, 'utf-8', (err, files) => {
        if (err) reject(err)

        files = files
          .filter((file) => file.includes(keyWord))
          .map((file) => ({
            file,
            mtime: fs.lstatSync(path.join(listFolderUrl, file)).mtime,
          }))
          .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())

        resolve(files[0].file)
      })
    })
  }
}
