
const paypal = Npm.require("paypal-rest-sdk");

Meteor.methods({

  "paypal/refund/create": function (paymentMethod, amount) {
    check(paymentMethod, ReactionCore.Schemas.PaymentMethod);
    check(amount, Number);
    this.unblock();

    paypal.configure(Meteor.Paypal.payflowAccountOptions());

    let createRefund = Meteor.wrapAsync(paypal.capture.refund, paypal.capture);
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
    console.log("Attempt to make a refund", result);

    return result;
  },

  "paypal/refund/list": function (paymentMethod) {
    check(paymentMethod, ReactionCore.Schemas.PaymentMethod);
    this.unblock();

    paypal.configure(Meteor.Paypal.payflowAccountOptions());

    let listPayments = Meteor.wrapAsync(paypal.payment.get, paypal.payment);
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
  }
});
