var PayFlow;

PayFlow = Npm.require("paypal-rest-sdk");

Meteor.methods({
  paypalSubmit: function(transactionType, cardData, paymentData) {
    var err, paymentObj, result, wrappedFunc;
    check(transactionType, String);
    check(cardData, Object);
    check(paymentData, Object);
    this.unblock();
    PayFlow.configure(Meteor.Paypal.payflowAccountOptions());
    paymentObj = Meteor.Paypal.paymentObj();
    paymentObj.intent = transactionType;
    paymentObj.payer.funding_instruments.push(Meteor.Paypal.parseCardData(cardData));
    paymentObj.transactions.push(Meteor.Paypal.parsePaymentData(paymentData));
    wrappedFunc = Meteor.wrapAsync(PayFlow.payment.create, PayFlow.payment);
    try {
      result = {
        saved: true,
        response: wrappedFunc(paymentObj)
      };
    } catch (_error) {
      err = _error;
      ReactionCore.Log.warn(err);
      result = {
        saved: false,
        error: err
      };
    }
    return result;
  },


  /**
   * Capture an authorized PayPal transaction
   * @param  {Object} paymentMethod A PaymentMethod object
   * @return {Object} results from PayPal normalized
   */
  "paypal/payment/capture": function (paymentMethod) {
    check(paymentMethod, ReactionCore.Schemas.PaymentMethod);
    this.unblock();

    PayFlow.configure(Meteor.Paypal.payflowAccountOptions());
    let result;

    // TODO: This should be changed to some ReactionCore method
    const shop = ReactionCore.Collections.Shops.findOne(ReactionCore.getShopId());
    const wrappedFunc = Meteor.wrapAsync(PayFlow.authorization.capture, PayFlow.authorization);
    const captureDetails = {
      amount: {
        currency: shop.currency,
        total: parseFloat(paymentMethod.amount, 10)
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

  getPayflowSettings: function() {
    var payflowSettings, settings;
    settings = Meteor.Paypal.payflowAccountOptions();
    payflowSettings = {
      mode: settings.mode,
      enabled: settings.enabled
    };
    return payflowSettings;
  }
});
