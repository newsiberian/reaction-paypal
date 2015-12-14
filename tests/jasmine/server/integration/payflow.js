/* eslint dot-notation: 0 */
/* eslint camelcase: 0 */

describe("Payment Methods", function () {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 150000; // the paypal call can take a while, so be patient
  initPaypal();
  describe("payflowProSubmit", function () {
    it("should create an authorization for this amount", function (done) {

      let cart = Factory.create("cart");
      let cartTotal = cart.cartTotal();

      const cardData = {
        first_name: "Test",
        last_name: "User",
        number: "4242424242424242",
        expire_month: "3",
        expire_year: "2017",
        cvv2: "345",
        type: "visa"
      };
      const paymentData = {
        total: cartTotal,
        currency: "USD"
      };

      const transactionType = "authorize";
      let result = Meteor.call("payflowProSubmit", transactionType, cardData, paymentData);
      expect(result).not.toBe(undefined);
      expect(result.response.state).toBe("approved");
      done();
    });
  });

  describe("payflowpro/payment/capture", function () {
    it("should capture the amount for a previously placed order", function (done) {
      let order = Factory.create("order");
      let result = authorizeOrder(order);
      let authorizationId = result.response.transactions[0].related_resources[0].authorization.id;
      let paymentMethod = getPaymentMethod(authorizationId);
      let captureResult = Meteor.call("payflowpro/payment/capture", paymentMethod);
      expect(captureResult.rawTransaction.state).toBe("completed");
      done();
    });
  });
  //
  //describe("payflowpro/refund/create", function () {
  //  it("Should Refund a Payment for an Order", function (done) {
  //    expect(null).toBe(null);
  //    done();
  //  });
  //});
});


function authorizeOrder(order) {
  let orderTotal = getOrderTotal(order);
  console.log(orderTotal);
  const cardData = {
    first_name: "Test",
    last_name: "User",
    number: "4242424242424242",
    expire_month: "3",
    expire_year: "2017",
    cvv2: "345",
    type: "visa"
  };
  const paymentData = {
    total: orderTotal,
    currency: "USD"
  };

  const transactionType = "authorize";
  return Meteor.call("payflowProSubmit", transactionType, cardData, paymentData);
}

function initPaypal() {
  let paypalSettingsId = ReactionCore.Collections.Packages.findOne({
    name: "reaction-paypal",
    shopId: ReactionCore.getShopId()
  })._id;

  ReactionCore.Collections.Packages.update(paypalSettingsId, {
    $set: {
      enabled: true, settings: {
        express_enabled: false,
        express_mode: false,
      }
    }
  });
}

function getOrderTotal(order) {

  let total;
  let subtotal = 0;
  let shippingTotal = 0;
  if (order.items) {
    for (let items of order.items) {
      subtotal += items.quantity * items.variants.price;
    }
  }
  // loop through the cart.shipping, sum shipments.
  if (order.shipping) {
    for (let shipment of order.shipping) {
      shippingTotal += shipment.shipmentMethod.rate;
    }
  }

  shippingTotal = parseFloat(shippingTotal);
  if (!isNaN(shippingTotal)) {
    subtotal = subtotal + shippingTotal;
  }
  total = subtotal.toFixed(2);
  return total;
}


function getPaymentMethod(authorizationId) {
  let paymentMethod = {
    "processor": "PayflowPro",
    "storedCard": "Visa 4242",
    "method": "credit_card",
    "transactionId": "0JM39054MC1990637",
    "metadata": {
      "authorizationId": authorizationId
    },
    "amount": 19.9899999999999984,
    "status": "created",
    "mode": "authorize",
    "createdAt": new Date(),
    "updatedAt": new Date(),
    "transactions": [
      {
        "id": "PAY-0D866761MK951201KKZVEIWI",
        "create_time": "2015-12-11T03:34:49Z",
        "update_time": "2015-12-11T03:35:01Z",
        "state": "approved",
        "intent": "authorize",
        "payer": {
          "payment_method": "credit_card",
          "funding_instruments": [
            {
              "credit_card": {
                "type": "visa",
                "number": "xxxxxxxxxxxx4242",
                "expire_month": "3",
                "expire_year": "2016",
                "first_name": "Brent",
                "last_name": "Hoover"
              }
            }
          ]
        },
        "transactions": [
          {
            "amount": {
              "total": "19.99",
              "currency": "USD",
              "details": {
                "subtotal": "19.99"
              }
            },
            "related_resources": [
              {
                "authorization": {
                  "id": "0JM39054MC1990637",
                  "create_time": new Date(),
                  "update_time": new Date(),
                  "amount": {
                    "total": "19.99",
                    "currency": "USD",
                    "details": {
                      "subtotal": "19.99"
                    }
                  },
                  "state": "authorized",
                  "parent_payment": "PAY-0D866761MK951201KKZVEIWI",
                  "valid_until": "2016-01-09T03:34:49Z",
                  "processor_response": {
                    "avs_code": "X",
                    "cvv_code": "M"
                  },
                  "fmf_details": {}
                }
              }
            ]
          }
        ],

        "httpStatusCode": 201
      }
    ],
    "workflow": {
      "status": "new"
    }
  };
  return paymentMethod;
}
