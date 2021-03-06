const PayFlow = Npm.require("paypal-rest-sdk");

Meteor.methods({
  "payflowProSubmit": function (transactionType, cardData, paymentData) {
    check(transactionType, String);
    check(cardData, Object);
    check(paymentData, Object);
    this.unblock();
    PayFlow.configure(Meteor.Paypal.payflowAccountOptions());
    let paymentObj = Meteor.Paypal.paymentObj();
    paymentObj.intent = transactionType;
    paymentObj.payer.funding_instruments.push(Meteor.Paypal.parseCardData(cardData));
    paymentObj.transactions.push(Meteor.Paypal.parsePaymentData(paymentData));
    const wrappedFunc = Meteor.wrapAsync(PayFlow.payment.create, PayFlow.payment);
    let result;
    try {
      result = {
        saved: true,
        response: wrappedFunc(paymentObj)
      };
    } catch (error) {
      ReactionCore.Log.warn(error);
      result = {
        saved: false,
        error: error
      };
    }
    return result;
  },


  /**
   * Capture an authorized PayPal transaction
   * @param  {Object} paymentMethod A PaymentMethod object
   * @return {Object} results from PayPal normalized
   */
  "payflowpro/payment/capture": function (paymentMethod) {
    check(paymentMethod, ReactionCore.Schemas.PaymentMethod);
    this.unblock();
    PayFlow.configure(Meteor.Paypal.payflowAccountOptions());
    let result;
    // TODO: This should be changed to some ReactionCore method
    const shop = ReactionCore.Collections.Shops.findOne(ReactionCore.getShopId());
    const wrappedFunc = Meteor.wrapAsync(PayFlow.authorization.capture, PayFlow.authorization);
    let captureTotal = Math.round(parseFloat(paymentMethod.amount) * 100) / 100;
    const captureDetails = {
      amount: {
        currency: shop.currency,
        total: captureTotal
      },
      is_final_capture: true // eslint-disable-line camelcase
    };

    try {
      const response = wrappedFunc(paymentMethod.metadata.authorizationId, captureDetails);

      result = {
        saved: true,
        metadata: {
          parentPaymentId: response.parent_payment,
          captureId: response.id
        },
        rawTransaction: response
      };
    } catch (e) {
      ReactionCore.Log.warn(e);
      result = {
        saved: false,
        error: e
      };
    }
    return result;
  },

  "payflowpro/refund/create": function (paymentMethod, amount) {
    check(paymentMethod, ReactionCore.Schemas.PaymentMethod);
    check(amount, Number);
    this.unblock();

    PayFlow.configure(Meteor.Paypal.payflowAccountOptions());

    let createRefund = Meteor.wrapAsync(PayFlow.capture.refund, PayFlow.capture);
    let result;

    try {
      let response = createRefund(paymentMethod.metadata.captureId, {
        amount: {
          total: amount,
          currency: "USD"
        }
      });

      result = {
        saved: true,
        type: "refund",
        created: response.create_time,
        amount: response.amount.total,
        currency: response.amount.currency,
        rawTransaction: response
      };
    } catch (e) {
      result = {
        saved: false,
        error: e
      };
    }
    return result;
  },

  "payflowpro/refund/list": function (paymentMethod) {
    check(paymentMethod, ReactionCore.Schemas.PaymentMethod);
    this.unblock();

    PayFlow.configure(Meteor.Paypal.payflowAccountOptions());

    let listPayments = Meteor.wrapAsync(PayFlow.payment.get, PayFlow.payment);
    let result;

    try {
      let response = listPayments(paymentMethod.metadata.parentPaymentId);
      result = [];

      for (let transaction of response.transactions) {
        for (let resource of transaction.related_resources) {
          if (_.isObject(resource.refund)) {
            if (resource.refund.state === "completed") {
              result.push({
                type: "refund",
                created: resource.refund.create_time,
                amount: Math.abs(resource.refund.amount.total),
                currency: resource.refund.amount.currency,
                rawTransaction: resource.refund
              });
            }
          }
        }
      }
    } catch (e) {
      ReactionCore.Log.warn("Couln't get paypal payment info", e);
      result = {
        error: e
      };
    }

    return result;
  },

  "getPayflowSettings": function () {
    let settings = Meteor.Paypal.payflowAccountOptions();
    let payflowSettings = {
      mode: settings.mode,
      enabled: settings.enabled
    };
    return payflowSettings;
  }
});
