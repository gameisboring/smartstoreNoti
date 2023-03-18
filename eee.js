var orders = [
  {
    productOrder: {
      quantity: 1,
      mallId: 'ncp_1o6cr6_01',
      productOrderId: '2023031656268291',
      productClass: '조합형옵션상품',
      productOrderStatus: 'PAYED',
      productName: '[케인] 뭉탱이 케인 슬리퍼 조합형',
      productId: '8174097567',
      itemNo: '29773646947',
      placeOrderStatus: 'NOT_YET',
      optionPrice: 0,
      productOption:
        '아프리카닉네임: 홈플러스 / 메세지: 시그니쳐 물티슈 WET WIPES / 사이즈: 260 / BJ: 영민 / 플마: 플러스',
      unitPrice: 10,
      productDiscountAmount: 0,
      deliveryPolicyType: '무료',
      deliveryFeeAmount: 0,
      sectionDeliveryFee: 0,
      totalPaymentAmount: 10,
      packageNumber: '2023031621712994',
      shippingFeeType: '무료',
      shippingDueDate: '2023-04-05T23:59:59.0+09:00',
      deliveryDiscountAmount: 0,
      optionCode: '29773646947',
      shippingAddress: [Object],
      totalProductAmount: 10,
      sellerBurdenDiscountAmount: 0,
      saleCommission: 0,
      expectedDeliveryMethod: 'DELIVERY',
      takingAddress: [Object],
      commissionRatingType: '결제수수료',
      commissionPrePayStatus: 'GENERAL_PRD',
      paymentCommission: 0,
      expectedSettlementAmount: 10,
      inflowPath: '네이버페이>홈(네이버쇼핑)',
      channelCommission: 0,
      knowledgeShoppingSellingInterlockCommission: 0,
    },
    order: {
      ordererTel: '01032883152',
      ordererNo: '100210162',
      payLocationType: 'PC',
      orderId: '2023031619926721',
      paymentDate: '2023-03-16T14:04:33.0+09:00',
      orderDiscountAmount: 0,
      orderDate: '2023-03-16T14:04:28.0+09:00',
      chargeAmountPaymentAmount: 0,
      generalPaymentAmount: 0,
      naverMileagePaymentAmount: 10,
      ordererId: 'daum****',
      ordererName: '선현규',
      paymentMeans: '포인트결제',
      isDeliveryMemoParticularInput: 'false',
      payLaterPaymentAmount: 0,
    },
  },
]

orders.map(function (productOrder) {
  return {
    productOrderId: productOrder.productOrder.productOrderId,
  }
})

console.log(orders)
