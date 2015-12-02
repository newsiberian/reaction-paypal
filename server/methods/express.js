var parseResponse;

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
          VERSION: '52.0',
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
          VERSION: '52.0',
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
    console.log(paymentMethod);
    check(paymentMethod, ReactionCore.Schemas.PaymentMethod);
    var result, options, response, amount, error, authorizationId;
    this.unblock();
    options = Meteor.Paypal.expressCheckoutAccountOptions();
    amount = paymentMethod.transactions[0].AMT;
    authorizationId = paymentMethod.transactions[0].TRANSACTIONID;

    try {
      response = HTTP.post(options.url, {
        params: {
          USER: options.username,
          PWD: options.password,
          SIGNATURE: options.signature,
          VERSION: '52.0',
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

    if (response.ACK !== 'Success') {
      throw new Meteor.Error('ACK ' + response.ACK + ': ' + response.L_LONGMESSAGE0);
    }

    result = {
      saved: true,
      metadata: {},
      rawTransaction: response
    };

    return result;
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
