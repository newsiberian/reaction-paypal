Template.paypalPaymentForm.onCreated(function() {
  Meteor.call("getExpressCheckoutSettings", function(error, expressCheckoutSettings) {
    if (!error) {
      return Session.set('expressCheckoutSettings', expressCheckoutSettings);
    }
  });
  return Meteor.call("getPayflowSettings", function(error, payflowSettings) {
    if (!error) {
      return Session.set('payflowSettings', payflowSettings);
    }
  });
});

Template.paypalPaymentForm.helpers({
  expressCheckoutEnabled: function() {
    var expressCheckoutSettings;
    expressCheckoutSettings = Session.get('expressCheckoutSettings');
    return expressCheckoutSettings != null ? expressCheckoutSettings.enabled : void 0;
  },
  payflowEnabled: function() {
    var payflowSettings;
    payflowSettings = Session.get('payflowSettings');
    return payflowSettings != null ? payflowSettings.enabled : void 0;
  }
});
