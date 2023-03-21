'use strict'

const fs = require('fs').promises
const axios = require('axios').default
const { io } = require('./server')
const log = require('electron-log')

const { createhashedSign } = require('./hash')
const { dateFormat, hoursAgo } = require('./time')

//  appdata/roaming/projectName
let listFileUrl = process.resourcesPath + '/list'

module.exports = class ApiControls {
  /**
   * Get Access Token from NaverCommerce API Center with Axios
   * @returns (String) access_token
   */
  async getOauthTokenToAxios() {
    const API = await JSON.parse(
      await fs.readFile(process.resourcesPath + '/APIconfig.json')
    )
    /* log.info('req params', {
      client_id: API.CLIENT_ID,
      timestamp: new Date().getTime() - 3000,
      client_secret_sign: await createhashedSign(
        `${API.CLIENT_ID}_${new Date().getTime() - 3000}`,
        API.CLIENT_SECRET
      ),
      grant_type: 'client_credentials',
      type: 'SELF',
      account_id: API.ACCOUNT_ID,
    }) */
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

  async addToPointList(mappedData) {
    // 2023-01-01_pointList.json
    // 리스트 파일로 저장
  }

  /**
   * Compare to Existing Order List
   */
  async compareExOrderList(mappedData) {
    const API = await JSON.parse(
      await fs.readFile(process.resourcesPath + '/APIconfig.json')
    )
    // 2023-01-01_list.json
    let listFileName = `/${dateFormat(hoursAgo(6))}_list.json`
    let pointListFileName = `/${dateFormat(hoursAgo(6))}_pointList.json`
    // 새로운 주문 넣을 빈 배열
    let notiOrders = []

    // 기존에 작성되어있는 Array 타입 JSON 파일
    let orderedList = JSON.parse(
      await fs.readFile(listFileUrl + listFileName, 'utf-8')
    )
    let pointList = JSON.parse(
      await fs.readFile(listFileUrl + pointListFileName, 'utf-8')
    )
    // 클래스 객체
    let apiControls = new ApiControls()

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
            orderedList.push({
              no: orderedList.length,
              productOrderId: mappedData[i].productOrderId,
              productId: mappedData[i].productId,
              presentSaleEvent: true,
            })
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

            orderedList.push({
              no: orderedList.length,
              productOrderId: mappedData[i].productOrderId,
              productId: mappedData[i].productId,
              presentSaleEvent: false,
            })
          }
        } else {
          orderedList.push({
            no: orderedList.length,
            productOrderId: mappedData[i].productOrderId,
            productId: mappedData[i].productId,
            presentSaleEvent: false,
          })

          notiOrders.push(mappedData[i])
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

        pointList.push({
          no: pointList.length,
          nick: mappedData[i].nick,
          productOrderId: mappedData[i].productOrderId,
          productId: mappedData[i].productId,
          bj: mappedData[i].bj,
          point: mappedData[i].point,
          orderDate: mappedData[i].date,
          quantity: mappedData[i].quantity,
        })
      }
    }

    // 리스트 파일로 저장
    await fs.writeFile(listFileUrl + listFileName, JSON.stringify(orderedList))
    await fs.writeFile(
      listFileUrl + pointListFileName,
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
          // 10초 전
          lastChangedFrom: new Date(new Date().getTime() - 10000),
          // lastChangedFrom: new Date(new Date().toDateString()),
          lastChangedType: 'PAYED',
        },
      })
        .then(async function (response) {
          var chekcData = response.data.hasOwnProperty('data')
          if (chekcData) {
            const mappedData = response.data.data.lastChangeStatuses.map(
              (change) => change.productOrderId
            )
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
      await fs.readFile(process.resourcesPath + '/APIconfig.json')
    )
    const RegexObj = {
      nick: new RegExp(`(?<=${API.NICK_OPT}: )(.*?)(?= \/)`),
      text: new RegExp(`(?<=${API.TEXT_OPT}: )(.*?)(?= \/)`),
      size: new RegExp(`(?<=${API.SIZE_OPT}: )(.*?)(?= \/)`),
      bj: new RegExp(`(?<=${API.BJ_OPT}: )(.*?)(?= \/)`),
      point: new RegExp(`(?<=${API.POINT_OPT}: )(.*?)(?= \/)`),
    }
    const orderList = await this.getChangeList()
    const check = this.compareExOrderList
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
              var returnVal = {
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
              return returnVal
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
          resolve(check(orders))
        })
        .catch(function (error) {
          log.error('getOrderList', error.response.data)
          resolve(error)
        })
    })
  }

  async getScoreList() {
    let scoreResult = new Object({ total: 0 })
    let pointListFileName = `/${dateFormat(hoursAgo(6))}_pointList.json`
    let pointList = JSON.parse(
      await fs.readFile(listFileUrl + pointListFileName, 'utf-8')
    )
    for (var i in pointList) {
      if (pointList[i].hasOwnProperty('bj')) {
        if (!scoreResult.hasOwnProperty(pointList[i].bj)) {
          scoreResult[pointList[i].bj] = { plus: 0, minus: 0, quantity: 0 }
        }

        if (pointList[i].point == '플러스') {
          scoreResult[pointList[i].bj].plus++
        } else if (pointList[i].point == '마이너스') {
          scoreResult[pointList[i].bj].minus++
        }

        scoreResult[pointList[i].bj].quantity += pointList[i].quantity
        scoreResult.total += pointList[i].quantity
      }
    }
    return scoreResult
  }

  async getCountForAdmin() {
    let counterResult = new Object({ TotalOrders: 0 })
    const API = await JSON.parse(
      await fs.readFile(process.resourcesPath + '/APIconfig.json')
    )
    let orderList = JSON.parse(
      await fs.readFile(
        listFileUrl + `/${dateFormat(hoursAgo(6))}_list.json`,
        'utf-8'
      )
    )

    orderList.forEach((element) => {
      counterResult.TotalOrders++
      if (!counterResult.hasOwnProperty(element.productId)) {
        counterResult[element.productId] = { TotalCount: 0, PreCount: 0 }
      }
      counterResult[element.productId].TotalCount++
      if (API.SALE_EVENT_CHECK) {
        if (API.SALE_EVENT_PRODUCT_ID == element.productId) {
          counterResult[element.productId].PreCount++
        }
      }
    })
    return counterResult
  }

  async getCountForClient() {
    let counterObj = new Object({ TotalCount: 0, PreCount: 0 })
    const API = await JSON.parse(
      await fs.readFile(process.resourcesPath + '/APIconfig.json')
    )
    let orderList = JSON.parse(
      await fs.readFile(
        listFileUrl + `/${dateFormat(hoursAgo(6))}_list.json`,
        'utf-8'
      )
    )
    counterObj.TotalCount = orderList.length
    orderList.forEach((element) => {
      if (API.SALE_EVENT_PRODUCT_ID) {
        if (API.SALE_EVENT_PRODUCT_ID == element.productId) {
          counterObj.PreCount++
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
        scoreboard[Object.keys(scoreboard)[i]].plus * 100 -
        scoreboard[Object.keys(scoreboard)[i]].minus * 100
      const coutribute = scoreboard[Object.keys(scoreboard)[i]].quantity * 100
      var newObj = {
        name: Object.keys(scoreboard)[i],
        score: score,
        contribute: coutribute,
        total: score + coutribute,
      }

      result.push(newObj)
    }

    result.sort(function (a, b) {
      if (a.score > b.score) return -1
      if (a.score < b.score) return 1
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
        scoreboard[Object.keys(scoreboard)[i]].plus * 100 -
        scoreboard[Object.keys(scoreboard)[i]].minus * 100
      const coutribute = scoreboard[Object.keys(scoreboard)[i]].quantity * 100
      var newObj = {
        이름: Object.keys(scoreboard)[i],
        점수: score,
        기여도: coutribute,
        종합점수: score + coutribute,
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
}
