PayFlow = Npm.require("paypal-rest-sdk")
PayPalCheckout = Npm.require("paypal-express-checkout")
Fiber = Npm.require("fibers")
Future = Npm.require("fibers/future")

Meteor.startup ->
  # set browser policy
  BrowserPolicy.content.allowOriginForAll("https://www.paypal.com")


Meteor.methods
  #submit (sale, authorize)
  paypalSubmit: (transactionType, cardData, paymentData) ->
    PayFlow.configure Meteor.Paypal.accountOptions()
    paymentObj = Meteor.Paypal.paymentObj()
    paymentObj.intent = transactionType
    paymentObj.payer.funding_instruments.push Meteor.Paypal.parseCardData(cardData)
    paymentObj.transactions.push Meteor.Paypal.parsePaymentData(paymentData)

    fut = new Future()
    @unblock()
    PayFlow.payment.create paymentObj, Meteor.bindEnvironment((error, result) ->
      if error
        fut.return
          saved: false
          error: error
      else
        fut.return
          saved: true
          response: result
      return
    , (e) ->
      ReactionCore.Events.warn e
      return
    )
    fut.wait()


  # capture (existing authorization)
  paypalCapture: (transactionId, captureDetails) ->
    PayFlow.configure Meteor.Paypal.accountOptions()

    fut = new Future()
    @unblock()
    PayFlow.authorization.capture transactionId, captureDetails, Meteor.bindEnvironment((error, result) ->
      if error
        fut.return
          saved: false
          error: error
      else
        fut.return
          saved: true
          response: result
      return
    , (e) ->
      ReactionCore.Events.warn e
      return
    )
    fut.wait()

  # used by pay with paypal button on the client
  getExpressCheckoutSettings: () ->

  	settings = ReactionCore.Collections.Packages.findOne(name: "reaction-paypal").settings

  	expressCheckoutSettings = {
  		merchant_id: settings.merchant_id
  		mode: settings.buynow_mode
  		enabled: settings.buynow_enabled
    }

  	return expressCheckoutSettings
