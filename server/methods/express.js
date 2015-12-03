let parseResponse;
let parseRefundReponse;
const nvpVersion = "52.0";

Meteor.methods({
  "getExpressCheckoutToken": function (cartId) {
    check(cartId, String);
    this.unblock();
    let cart = ReactionCore.Collections.Cart.findOne(cartId);
    if (!cart) {
      throw new Meteor.Error("Bad cart ID");
    }
    let shop = ReactionCore.Collections.Shops.findOne(cart.shopId);
    if (!shop) {
      throw new Meteor.Error("Bad shop ID");
    }
    let amount = Number(cart.cartTotal());
    let description = shop.name + " Ref: " + cartId;
    let currency = shop.currency;
    let options = Meteor.Paypal.expressCheckoutAccountOptions();
    let response;
    try {
      response = HTTP.post(options.url, {
        params: {
          USER: options.username,
          PWD: options.password,
          SIGNATURE: options.signature,
          SOLUTIONTYPE: "Mark",
          VERSION: nvpVersion,
          PAYMENTACTION: "Authorization",
          AMT: amount,
          RETURNURL: options.return_url,
          CANCELURL: options.cancel_url,
          DESC: description,
          NOSHIPPING: 1,
          ALLOWNOTE: 1,
          CURRENCYCODE: currency,
          METHOD: "SetExpressCheckout",
          INVNUM: cartId,
          CUSTOM: cartId + "|" + amount + "|" + currency
        }
      });
    } catch (error) {
      throw new Meteor.Error(error.message);
    }
    if (!response || response.statusCode !== 200) {
      throw new Meteor.Error("Bad response from PayPal");
    }
    let parsedResponse = parseResponse(response);
    if (parsedResponse.ACK !== "Success") {
      throw new Meteor.Error("ACK " + parsedResponse.ACK + ": " + parsedResponse.L_LONGMESSAGE0);
    }
    return response.TOKEN;
  },
  "confirmPaymentAuthorization": function (cartId, token, payerId) {
    check(cartId, String);
    check(token, String);
    check(payerId, String);
    this.unblock();
    let cart = ReactionCore.Collections.Cart.findOne(cartId);
    if (!cart) {
      throw new Meteor.Error("Bad cart ID");
    }
    let amount = Number(cart.cartTotal());
    let options = Meteor.Paypal.expressCheckoutAccountOptions();
    let response;
    try {
      response = HTTP.post(options.url, {
        params: {
          USER: options.username,
          PWD: options.password,
          SIGNATURE: options.signature,
          VERSION: nvpVersion,
          PAYMENTACTION: "Authorization",
          AMT: amount,
          METHOD: "DoExpressCheckoutPayment",
          TOKEN: token,
          PAYERID: payerId
        }
      });
    } catch (error) {
      throw new Meteor.Error(error.message);
    }
    if (!response || response.statusCode !== 200) {
      throw new Meteor.Error("Bad response from PayPal");
    }
    let parsedResponse = parseResponse(response);
    if (parsedResponse.ACK !== "Success") {
      throw new Meteor.Error("ACK " + parsedResponse.ACK + ": " + parsedResponse.L_LONGMESSAGE0);
    }
    return parsedResponse;
  },
  "getExpressCheckoutSettings": function () {
    let settings = Meteor.Paypal.expressCheckoutAccountOptions();
    let expressCheckoutSettings = {
      merchantId: settings.merchantId,
      mode: settings.mode,
      enabled: settings.enabled
    };
    return expressCheckoutSettings;
  },

  /**
   * Capture an authorized PayPalExpress transaction
   * https://developer.paypal.com/docs/classic/api/merchant/DoCapture_API_Operation_NVP/
   * @param  {Object} paymentMethod A PaymentMethod object
   * @return {Object} results from PayPal normalized
   */
  "paypalexpress/payment/capture": function (paymentMethod) {
    check(paymentMethod, ReactionCore.Schemas.PaymentMethod);
    this.unblock();
    let options = Meteor.Paypal.expressCheckoutAccountOptions();
    let amount = paymentMethod.transactions[0].AMT;
    let authorizationId = paymentMethod.transactions[0].TRANSACTIONID;
    let currencycode = paymentMethod.transactions[0].CURRENCYCODE;
    let response;
    try {
      response = HTTP.post(options.url, {
        params: {
          USER: options.username,
          PWD: options.password,
          SIGNATURE: options.signature,
          VERSION: nvpVersion,
          METHOD: "DoCapture",
          AUTHORIZATIONID: authorizationId,
          AMT: amount,
          COMPLETETYPE: "Complete" // TODO: Allow for partial captures
        }
      });
    } catch (error) {
      throw new Meteor.Error(error.message);
    }

    if (!response || response.statusCode !== 200) {
      throw new Meteor.Error("Bad Response from Paypal during Capture");
    }

    let parsedResponse = parseResponse(response);

    if (parsedResponse.ACK !== "Success") {
      throw new Meteor.Error("ACK " + parsedResponse.ACK + ": " + parsedResponse.L_LONGMESSAGE0);
    }

    let result = {
      saved: true,
      authorizationId: parsedResponse.AUTHORIZATIONID,
      transactionId: parsedResponse.TRANSACTIONID,
      currencycode: currencycode,
      metadata: {},
      rawTransaction: parsedResponse
    };

    return result;
  },

  /**
   * Refund an order using the PayPay Express method
   * https://developer.paypal.com/docs/classic/api/merchant/RefundTransaction_API_Operation_NVP/
   * @param  {Object} paymentMethod A PaymentMethod object
   * @param {Number} amount to be refunded
   * @return {Object} results from PayPal normalized
   */
  "paypalexpress/refund/create": function (paymentMethod, amount) {
    check(paymentMethod, ReactionCore.Schemas.PaymentMethod);
    check(amount, Number);
    this.unblock();
    let options = Meteor.Paypal.expressCheckoutAccountOptions();
    let previousTransaction = paymentMethod.transactions[1];
    let transactionId = previousTransaction.transactionId;
    let currencycode = previousTransaction.CURRENCYCODE;
    let response;
    try {
      response = HTTP.post(options.url, {
        params: {
          USER: options.username,
          PWD: options.password,
          SIGNATURE: options.signature,
          VERSION: nvpVersion,
          METHOD: "RefundTransaction",
          TRANSACTIONID: transactionId,
          REFUNDTYPE: "Partial",
          AMT: amount,
          CURRENCYCODE: currencycode
        }
      });
    }  catch (error) {
      throw new Meteor.Error(error.message);
    }

    if (!response || response.statusCode !== 200) {
      throw new Meteor.Error("Bad Response from Paypal during Refund Creation");
    }

    let parsedResponse = parseResponse(response);
    if (parsedResponse.ACK !== "Success") {
      throw new Meteor.Error("ACK " + parsedResponse.ACK + ": " + parsedResponse.L_LONGMESSAGE0);
    }

    let amountFormatted = {
      total: amount,
      currency: currencycode
    };

    let result = {
      saved: true,
      type: "refund",
      created: new Date(),
      transactionId: transactionId,
      refundTransactionId: parsedResponse.REFUNDTRANSACTIONID,
      grossRefundAmount: parsedResponse.GROSSREFUNDAMT,
      netRefundAmount: parsedResponse.NETREFUNDAMT,
      correlationId: parsedResponse.CORRELATIONID,
      currency: parsedResponse.CURRENCYCODE,
      amount: amountFormatted,
      rawTransaction: parsedResponse
    };
    return result;
  },
  "paypalexpress/refund/list": function (paymentMethod) {
    check(paymentMethod, ReactionCore.Schemas.PaymentMethod);
    this.unblock();
    let options = Meteor.Paypal.expressCheckoutAccountOptions();
    let transactionId = paymentMethod.transactionId;
    let response;
    try {
      response = HTTP.post(options.url, {
        params: {
          USER: options.username,
          PWD: options.password,
          SIGNATURE: options.signature,
          VERSION: nvpVersion,
          METHOD: "TransactionSearch",
          STARTDATE: "2013-08-24T05:38:48Z",
          TRANSACTIONID: transactionId,
          TRANSACTIONCLASS: "Refund"
        }
      });
    }  catch (error) {
      throw new Meteor.Error(error.message);
    }

    if (!response || response.statusCode !== 200) {
      throw new Meteor.Error("Bad Response from Paypal during refund list");
    }

    let parsedResponse = parseResponse(response);

    if (parsedResponse.ACK !== "Success") {
      throw new Meteor.Error("ACK " + parsedResponse.ACK + ": " + parsedResponse.L_LONGMESSAGE0);
    }
    let result = parseRefundReponse(response);
    return result;
  }

});

parseResponse = function (response) {
  let result = {};
  let pieces = response.content.split("&");
  pieces.forEach(function (piece) {
    let subpieces = piece.split("=");
    let decodedResult = result[subpieces[0]] = decodeURIComponent(subpieces[1]);
    return decodedResult;
  });
  return result;
};

parseRefundReponse = function (response) {
  let paypalArray = [];

  for (let i = 0; i < 101; i++) {
    let timeStampKey = "L_TIMESTAMP" + i;
    let timestamp = response[timeStampKey];
    let typeKey = "L_TYPE" + i;
    let transactionType = response[typeKey];
    let amountKey = "L_AMT" + i;
    let amount = response[amountKey];
    let currencyCodeKey = "L_CURRENCYCODE" + i;
    let currencyCode = response[currencyCodeKey];

    if (timestamp !== undefined && transactionType === "Refund") {
      let responseObject = {
        created: moment(timestamp).valueOf(),
        type: "refund",
        amount: Math.abs(Number(amount, 10)),
        currency: currencyCode
      };
      paypalArray.push(responseObject);
    }
  }

  return paypalArray;
};
