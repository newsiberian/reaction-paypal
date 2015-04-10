Template.paypalCheckoutButton.rendered = ->
  Meteor.Paypal.initExpress this.$('.paypal-checkout-button-container')[0]
