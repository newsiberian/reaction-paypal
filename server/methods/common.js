
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
    ReactionCore.Log.info("Attempt to make a refund", result);

    return result;
  },

  "paypal/refund/list": function (paymentMethod) {
    check(paymentMethod, ReactionCore.Schemas.PaymentMethod);
    this.unblock();

    paypal.configure(Meteor.Paypal.payflowAccountOptions());
    // handle different style refunds
    if (paymentMethod.metadata && paymentMethod.processor === "Paypal" && paymentMethod.method === "Paypal Express Checkout") {
      let listPayments = Meteor.wrapAsync(paypal.payment.get, paypal.payment);
      let result;

      try {
        ReactionCore.Log.info("paymentMethod - express", paymentMethod);
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
      } catch (error) {
        ReactionCore.Log.warn("Failed to getting paypal payment info", error);
        result = {
          error: error
        };
      }
    }
    return result;
  }
});
