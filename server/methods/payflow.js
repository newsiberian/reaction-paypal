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
  paypalCapture: function(transactionId, captureDetails) {
    var err, result, wrappedFunc;
    check(transactionId, String);
    check(captureDetails, Object);
    this.unblock();
    PayFlow.configure(Meteor.Paypal.payflowAccountOptions());
    wrappedFunc = Meteor.wrapAsync(PayFlow.authorization.capture, PayFlow.authorization);
    try {
      result = {
        saved: true,
        response: wrappedFunc(transactionId, captureDetails)
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
