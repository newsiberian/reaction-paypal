Template.paypalPaymentForm.created = () ->
  Meteor.call "getExpressCheckoutSettings", (error, expressCheckoutSettings) ->
    Session.set 'expressCheckoutSettings', expressCheckoutSettings unless error
  Meteor.call "getPayflowSettings", (error, payflowSettings) ->
    Session.set 'payflowSettings', payflowSettings unless error

Template.paypalPaymentForm.helpers
  expressCheckoutEnabled: ->
    expressCheckoutSettings = Session.get 'expressCheckoutSettings'
    return expressCheckoutSettings?.enabled
  payflowEnabled: ->
    payflowSettings = Session.get 'payflowSettings'
    return payflowSettings?.enabled
