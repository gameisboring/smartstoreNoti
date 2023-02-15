// 즉시실행함수 IIFE
async function renderNoti() {
  console.log('renderNoti')
  const orderList = data.data.data.map(
    (order) => order.productOrder.productOption
  )
  orderList.forEach((orderProductOption) => {
    console.log(orderProductOption)
    document.querySelector('.main').innerHTML += orderProductOption + '<br>'
  })
}

function setDelay(i) {
  setTimeout(function () {}, 1000 * i)
}
