Template.paypalSettings.helpers({
  packageData: function() {
    return ReactionCore.Collections.Packages.findOne({
      name: "reaction-paypal"
    });
  }
});

AutoForm.hooks({
  "paypal-update-form": {
    onSuccess: function(operation, result, template) {
      Alerts.removeSeen();
      return Alerts.add("Paypal settings saved.", "success", {
        autoHide: true
      });
    },
    onError: function(operation, error, template) {
      Alerts.removeSeen();
      return Alerts.add("Paypal settings update failed. " + error, "danger");
    }
  }
});
