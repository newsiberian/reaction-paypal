let containerElement = null;
let ready = false;
let expressCheckoutSettings = null;

function doSetup() {
  if (containerElement && ready && expressCheckoutSettings && expressCheckoutSettings.enabled) {
    return paypal.checkout.setup(expressCheckoutSettings.merchantId, {
      environment: expressCheckoutSettings.mode,
      container: containerElement,
      click: function () {
        paypal.checkout.initXO();
        let cart = ReactionCore.Collections.Cart.findOne();
        if (!cart) {
          return undefined;
        }
        return Meteor.call("getExpressCheckoutToken", cart._id, function (error, token) {
          if (error) {
            let msg = (error !== null ? error.error : void 0) || i18n.t("checkoutPayment.processingError", "There was a problem with your payment.");
            Alerts.add(msg, "danger", {
              placement: "paymentMethod"
            });
            return paypal.checkout.closeFlow();
          }
          let url = paypal.checkout.urlPrefix + token;
          return paypal.checkout.startFlow(url);
        });
      }
    });
  }
}

window.paypalCheckoutReady = function () {
  ready = true;
  return doSetup();
};

Tracker.autorun(function () {
  expressCheckoutSettings = Session.get("expressCheckoutSettings");
  return doSetup();
});

Template.paypalCheckoutButton.onRendered(function () {
  containerElement = this.$(".paypal-checkout-button-container")[0];
  return doSetup();
});
