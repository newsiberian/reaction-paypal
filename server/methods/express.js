var parseResponse;
var nvpVersion = '52.0';

Meteor.methods({
  getExpressCheckoutToken: function(cartId) {
    var amount, cart, currency, description, error, options, response, shop;
    check(cartId, String);
    this.unblock();
    cart = ReactionCore.Collections.Cart.findOne(cartId);
    if (!cart) {
      throw new Meteor.Error('Bad cart ID');
    }
    shop = ReactionCore.Collections.Shops.findOne(cart.shopId);
    if (!shop) {
      throw new Meteor.Error('Bad shop ID');
    }
    amount = Number(cart.cartTotal());
    description = shop.name + " Ref: " + cartId;
    currency = shop.currency;
    options = Meteor.Paypal.expressCheckoutAccountOptions();
    try {
      response = HTTP.post(options.url, {
        params: {
          USER: options.username,
          PWD: options.password,
          SIGNATURE: options.signature,
          SOLUTIONTYPE: 'Mark',
          VERSION: nvpVersion,
          PAYMENTACTION: 'Authorization',
          AMT: amount,
          RETURNURL: options.return_url,
          CANCELURL: options.cancel_url,
          DESC: description,
          NOSHIPPING: 1,
          ALLOWNOTE: 1,
          CURRENCYCODE: currency,
          METHOD: 'SetExpressCheckout',
          INVNUM: cartId,
          CUSTOM: cartId + '|' + amount + '|' + currency
        }
      });
    } catch (_error) {
      error = _error;
      throw new Meteor.Error(error.message);
    }
    if (!response || response.statusCode !== 200) {
      throw new Meteor.Error('Bad response from PayPal');
    }
    response = parseResponse(response);
    if (response.ACK !== 'Success') {
      throw new Meteor.Error('ACK ' + response.ACK + ': ' + response.L_LONGMESSAGE0);
    }
    return response.TOKEN;
  },
  confirmPaymentAuthorization: function(cartId, token, payerId) {
    var amount, cart, error, options, response;
    check(cartId, String);
    check(token, String);
    check(payerId, String);
    this.unblock();
    cart = ReactionCore.Collections.Cart.findOne(cartId);
    if (!cart) {
      throw new Meteor.Error('Bad cart ID');
      return;
    }
    amount = Number(cart.cartTotal());
    options = Meteor.Paypal.expressCheckoutAccountOptions();
    try {
      response = HTTP.post(options.url, {
        params: {
          USER: options.username,
          PWD: options.password,
          SIGNATURE: options.signature,
          VERSION: nvpVersion,
          PAYMENTACTION: 'Authorization',
          AMT: amount,
          METHOD: 'DoExpressCheckoutPayment',
          TOKEN: token,
          PAYERID: payerId
        }
      });
    } catch (_error) {
      error = _error;
      throw new Meteor.Error(error.message);
    }
    if (!response || response.statusCode !== 200) {
      throw new Meteor.Error('Bad response from PayPal');
    }
    response = parseResponse(response);
    if (response.ACK !== 'Success') {
      throw new Meteor.Error('ACK ' + response.ACK + ': ' + response.L_LONGMESSAGE0);
    }
    return response;
  },
  getExpressCheckoutSettings: function() {
    var expressCheckoutSettings, settings;
    settings = Meteor.Paypal.expressCheckoutAccountOptions();
    expressCheckoutSettings = {
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
  "paypalexpress/payment/capture": function(paymentMethod) {
    check(paymentMethod, ReactionCore.Schemas.PaymentMethod);
    var result, options, response, amount, error, authorizationId, currencycode;
    this.unblock();
    options = Meteor.Paypal.expressCheckoutAccountOptions();
    amount = paymentMethod.transactions[0].AMT;
    authorizationId = paymentMethod.transactions[0].TRANSACTIONID;
    currencycode = paymentMethod.transactions[0].CURRENCYCODE;
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
    } catch (_error) {
      error = _error;
      throw new Meteor.Error(error.message);
    }

    if (!response || response.statusCode !== 200) {
      throw new Meteor.Error('Bad Response from Paypal during Capture');
    }

    response = parseResponse(response);
    console.log('Response from Capture');
    console.log(JSON.stringify(response, null, 4));

    if (response.ACK !== 'Success') {
      throw new Meteor.Error('ACK ' + response.ACK + ': ' + response.L_LONGMESSAGE0);
    }

    result = {
      saved: true,
      authorizationId: response.AUTHORIZATIONID,
      transactionId: response.TRANSACTIONID,
      currencycode: currencycode,
      metadata: {},
      rawTransaction: response
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

  "paypalexpress/refund/create": function(paymentMethod, amount) {
    check(paymentMethod, ReactionCore.Schemas.PaymentMethod);
    check(amount, Number);
    var result, response, options, error, transactionId, currencycode;
    this.unblock();
    options = Meteor.Paypal.expressCheckoutAccountOptions();
    var previousTransaction = paymentMethod.transactions[1];
    transactionId = previousTransaction.transactionId;
    currencycode = previousTransaction.CURRENCYCODE;

    try {
      response = HTTP.post(options.url, {
        params: {
          USER: options.username,
          PWD: options.password,
          SIGNATURE: options.signature,
          VERSION: nvpVersion,
          METHOD: 'RefundTransaction',
          TRANSACTIONID: transactionId,
          REFUNDTYPE: 'Partial',
          AMT: amount,
          CURRENCYCODE: 'USD'
        }
      });
    }  catch (_error) {
      error = _error;
      throw new Meteor.Error(error.message);
    }

    if (!response || response.statusCode !== 200) {
      throw new Meteor.Error('Bad Response from Paypal during Capture');
    }

    response = parseResponse(response);

    if (response.ACK !== 'Success') {
      throw new Meteor.Error('ACK ' + response.ACK + ': ' + response.L_LONGMESSAGE0);
    }

    result = {
      saved: true,
      transactionId: transactionId,
      refundTransactionId: response.REFUNDTRANSACTIONID,
      grossRefundAmount: response.GROSSREFUNDAMT,
      netRefundAmount: response.NETREFUNDAMT,
      correlationId: response.CORRELATIONID,
      currencycode: currencycode,
      amount: amount,
      metadata: {},
      rawTransaction: response
    };

    return result;



  },
  "paypalexpress/refund/list": function() {
    console.log('Executed stub function for refund/list');
    return [];
  }

});

parseResponse = function(response) {
  var pieces, result;
  result = {};
  pieces = response.content.split('&');
  pieces.forEach(function(piece) {
    var subpieces;
    subpieces = piece.split('=');
    return result[subpieces[0]] = decodeURIComponent(subpieces[1]);
  });
  return result;
};
