Template.paypalDashboard.helpers({
  packageData: function () {
    return ReactionCore.Collections.Packages.findOne({
      name: "reaction-paypal"
    });
  }
});

Template.paypalDashboard.events({
  "click [data-event-action=showPaypalSettings]": function () {
    ReactionCore.showActionView();
  }
});
