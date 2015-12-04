/* eslint camelcase: 0 */

Meteor.Paypal = {
  payflowAccountOptions: function () {
    let settings = ReactionCore.Collections.Packages.findOne({
      name: "reaction-paypal",
      shopId: ReactionCore.getShopId(),
      enabled: true
    }).settings;
    let mode;
    if ((settings !== null ? settings.payflow_mode : void 0) === true) {
      mode = "live";
    } else {
      mode = "sandbox";
    }
    let ref;
    let ref1;
    let ref2;
    let options = {
      mode: mode,
      enabled: (settings !== null ? settings.payflow_enabled : void 0) || ((ref = Meteor.settings.paypal) !== null ? ref.payflow_enabled : void 0),
      client_id: (settings !== null ? settings.client_id : void 0) || ((ref1 = Meteor.settings.paypal) !== null ? ref1.client_id : void 0),
      client_secret: (settings !== null ? settings.client_secret : void 0) || ((ref2 = Meteor.settings.paypal) !== null ? ref2.client_secret : void 0)
    };
    if (!options.client_id) {
      throw new Meteor.Error(403, "Invalid PayPal Credentials");
    }
    return options;
  },
  expressCheckoutAccountOptions: function () {
    let settings = ReactionCore.Collections.Packages.findOne({
      name: "reaction-paypal",
      shopId: ReactionCore.getShopId(),
      enabled: true
    }).settings;
    let mode;
    if ((settings !== null ? settings.express_mode : void 0) === true) {
      mode = "production";
    } else {
      mode = "sandbox";
    }
    let ref = Meteor.settings.paypal;
    let options = {
      enabled: settings !== null ? settings.express_enabled : void 0,
      mode: mode,
      username: getSettings(settings, ref, 'username'),
      password: getSettings(settings, ref, 'password'),
      signature: getSettings(settings, ref, 'signature'),
      merchantId: getSettings(settings, ref, 'merchantId'),
      return_url: Meteor.absoluteUrl("paypal/done"),
      cancel_url: Meteor.absoluteUrl("paypal/cancel")
    };
    if (options.mode === "sandbox") {
      options.url = "https://api-3t.sandbox.paypal.com/nvp";
    } else {
      options.url = "https://api-3t.paypal.com/nvp";
    }
    return options;
  },
  authorize: function (cardInfo, paymentInfo, callback) {
    Meteor.call("payflowProSubmit", "authorize", cardInfo, paymentInfo, callback);
  },
  capture: function (transactionId, amount, callback) {
    let captureDetails = {
      amount: {
        currency: "USD",
        total: parseFloat(amount, 10)
      },
      is_final_capture: true
    };
    Meteor.call("paypalCapture", transactionId, captureDetails, callback);
  },
  config: function (options) {
    this.accountOptions = options;
  },
  paymentObj: function () {
    return {
      intent: "sale",
      payer: {
        payment_method: "credit_card",
        funding_instruments: []
      },
      transactions: []
    };
  },
  parseCardData: function (data) {
    return {
      credit_card: {
        type: data.type,
        number: data.number,
        first_name: data.first_name,
        last_name: data.last_name,
        cvv2: data.cvv2,
        expire_month: data.expire_month,
        expire_year: data.expire_year
      }
    };
  },
  parsePaymentData: function (data) {
    return {
      amount: {
        total: parseFloat(data.total, 10),
        currency: data.currency
      }
    };
  }
};

function getSettings(settings, ref, valueName) {
  if (settings !== null) {
    return settings[valueName];
  } else {
    if (ref !== null) {
      return ref[valueName];
    }
  }
}
