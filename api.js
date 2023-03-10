const electron = require('electron')
const elApp = electron.app
const userDataPath = elApp.getPath('userData')
const fs = require('fs').promises
const axios = require('axios').default
const { dateFormat, fourHoursAgo } = require('./time')
const { io } = require('./server')
// const { Polly } = require('./tts')

// const API = require(userDataPath + '/APIconfig.json')
const { createhashedSign } = require('./hash')
// 2023-01-01_list.json
let listFileName = `/${dateFormat(fourHoursAgo())}_list.json`
// 2023-01-01_pointList.json
let pointListFileName = `/${dateFormat(fourHoursAgo())}_pointList.json`
//  appdata/roaming/projectName
let listFileUrl = elApp.getPath('userData') + '/list'

module.exports = class ApiControls {
  /**
   * Get Access Token from NaverCommerce API Center with Axios
   * @returns (String) access_token
   */
  async getOauthTokenToAxios() {
    const API = await this.getAPIconfig()
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
          console.log(
            'OAuth Token Expires in',
            `${Math.floor(response.data.expires_in / 60)}분 ${
              response.data.expires_in % 60
            }초`
          )
          resolve(response.data.access_token)
        })
        .catch(function (error) {
          console.log('getOauthTokenToAxios', error.response.data)

          resolve(false)
        })
    })
  }

  /**
   * Compare to Existing Order List
   */
  async compareExOrderList(mappedData) {
    // 새로운 주문 넣을 빈 배열
    let newOrders = []
    // 기존에 작성되어있는 Array 타입 JSON 파일
    let orderedList = JSON.parse(
      await fs.readFile(listFileUrl + listFileName, 'utf-8')
    )
    let pointList = JSON.parse(
      await fs.readFile(listFileUrl + pointListFileName, 'utf-8')
    )
    // 파라미터로 넘어온 데이터 순회하며 중복조회
    for (var i in mappedData) {
      var result = orderedList.filter(
        // productOrderId 중복이면 필터링
        (order) => order.orderId == mappedData[i].productOrderId
      )

      var pointResult = pointList.filter(
        // productOrderId 중복이면 필터링
        (order) => order.orderId == mappedData[i].productOrderId
      )

      if (pointResult.length == 0) {
        // 불러온 포인트 리스트에 데이터 추가
        pointList.push({
          no: pointList.length,
          nick: mappedData[i].nick,
          orderId: mappedData[i].productOrderId,
          bj: mappedData[i].bj,
          point: mappedData[i].point,
          orderDate: mappedData[i].date,
          quantity: mappedData[i].quantity,
        })
        // 리스트 파일로 저장
        await fs.writeFile(
          listFileUrl + pointListFileName,
          JSON.stringify(pointList)
        )
      }

      // 이전 기록과 비교해서 겹치는 게 없을 때(필터링 된 데이터 없음)
      if (result.length == 0) {
        console.log(
          `[새로운 주문] 주문번호:${mappedData[i].productOrderId} | 상품:${mappedData[i].productName} | 수량: ${mappedData[i].quantity}ea | 구매자: ${mappedData[i].nick} | BJ포인트: ${mappedData[i].bj}${mappedData[i].point}`
        )

        io.on('connection', async function (socket) {
          console.log(socket.id, 'Connected')
          socket.emit('connection', `${socket.id} 연결 되었습니다.`)
          socket.emit('orderList', await this.getOrderList())
          socket.emit('scoreboard', await this.scoreBoardToUsableData())
        })

        // 불러온 기존데이터 리스트에 추가
        orderedList.push({
          no: orderedList.length,
          orderId: mappedData[i].productOrderId,
        })

        // 리스트 파일로 저장
        await fs.writeFile(
          listFileUrl + listFileName,
          JSON.stringify(orderedList)
        )

        // 새로운 주문목록에 추가
        newOrders.push(mappedData[i])
      }
    }
    // 순회 마치고 새롭게 추가된 데이터 반환
    return newOrders
  }

  /**
   * Get Changed Product Order Details
   * @returns (JSON) Changed Statuses
   */
  async getChangeList() {
    const oauthToken = await this.getOauthTokenToAxios()
    Polly.synthesizeSpeech(params, async (err, data) => {
      if (err) {
        console.log(err.code)
      } else if (data) {
        if (data.AudioStream instanceof Buffer) {
          await fs.writeFile(
            userDataPath + './speech.mp3',
            data.AudioStream,
            function (err) {
              if (err) {
                return console.log(err)
              }
              console.log('The file was saved!')
            }
          )
        }
      }
    })
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
          /* TODO 10초 간격*/
          lastChangedFrom: new Date(new Date().getTime() - 100000),
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
          console.error('getChangeList', error.response.data)
          resolve(false)
        })
    })
  }

  /**
   * get Order List
   */
  async getOrderList() {
    const API = await this.getAPIconfig()
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
        .then((response) => {
          const placedOrder = response.data.data
            // 발주한 상품 상세 데이터에는 'placeOrderDate'라는 KEY 가 존재함
            .filter((order) =>
              order.productOrder.hasOwnProperty('placeOrderDate')
            )
            /**
            조회한 데이터 파싱
            productOrder.productOrder.productOption
            옵션으로 적은 값 포함되어있음 구분자는 '/'
            */
            .map((productOrder) => {
              const options = productOrder.productOrder.productOption.split('/')
              return {
                productOrderId: productOrder.productOrder.productOrderId,
                quantity: productOrder.productOrder.quantity,
                nick: options[0].split(API.NICK_OPT + ': ')[1],
                text: options[1].split(API.TEXT_OPT + ': ')[1],
                size: options[2].split(API.SIZE_OPT + ': ')[1],
                bj: options[3].split(API.BJ_OPT + ': ')[1],
                point: options[4].split(API.POINT_OPT + ': ')[1],
                productName:
                  productOrder.productOrder.productName.split(']')[1],
                date: productOrder.order.paymentDate,
              }
            })

          resolve(check(placedOrder))
        })
        .catch(function (error) {
          console.error('getChangeList', error.response.data)
          resolve(error)
        })
    })
  }

  async getScroeList() {
    let scoreResult = new Object({})
    scoreResult.total = 0
    let pointList = JSON.parse(
      await fs.readFile(listFileUrl + pointListFileName, 'utf-8')
    )
    for (var i in pointList) {
      if (!scoreResult.hasOwnProperty(pointList[i].bj)) {
        scoreResult[pointList[i].bj] = { plus: 0, minus: 0, quantity: 0 }
      }

      if (pointList[i].point == '플러스') {
        scoreResult[pointList[i].bj].plus++
      } else if (pointList[i].point == '마이너스') {
        scoreResult[pointList[i].bj].minus++
      }

      scoreResult[pointList[i].bj].quantity += pointList[i].quantity
      scoreResult.total++
    }
    return scoreResult
  }

  async scoreBoardToUsableData() {
    let scoreboard = await this.getScroeList()
    // 주문건수만 먹고 버리기
    let total = Number(scoreboard.total)
    delete scoreboard.total

    let result = new Array()

    for (var i in Object.keys(scoreboard)) {
      var newObj = {
        name: Object.keys(scoreboard)[i],
        score:
          scoreboard[Object.keys(scoreboard)[i]].plus * 100 -
          scoreboard[Object.keys(scoreboard)[i]].minus * 100,
        contribute: scoreboard[Object.keys(scoreboard)[i]].quantity * 100,
      }
      result.push(newObj)
    }
    result.sort((a, b) => b.score - a.score)
    return { result, total }
  }

  async getAPIconfig() {
    return JSON.parse(await fs.readFile(userDataPath + '/APIconfig.json'))
  }
}
