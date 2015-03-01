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
    check transactionType, String
    check cardData, Object
    check paymentData, Object

    PayFlow.configure Meteor.Paypal.payflowAccountOptions()
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
    check transactionId, String
    check captureDetails, Object

    PayFlow.configure Meteor.Paypal.payflowAccountOptions()

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

  expressCheckoutPay: (amount, description, currency) ->
    check amount, String
    check description, String
    check currency, String

    options = Meteor.Paypal.expressCheckoutAccountOptions()

    PayPalCheckout.init(options.username, options.password, options.signature, options.return_url, options.cancel_url);
    invoiceNumber = "214325325"
    fut = new Future()
    @unblock()
    PayPalCheckout.pay invoiceNumber, amount, description, currency, (error, url) ->
      if error
        fut.return
          saved: false
          error: error
      else
        fut.return
          saved: true
          url: url
    fut.wait()


  # used by pay with paypal button on the client
  getExpressCheckoutSettings: () ->

  	settings = ReactionCore.Collections.Packages.findOne(name: "reaction-paypal").settings

  	expressCheckoutSettings = {
  		merchant_id: settings.merchant_id
  		mode: settings.express_mode
  		enabled: settings.express_enabled
    }

  	return expressCheckoutSettings

  # used by pay with paypal button on the client
  getPayflowSettings: () ->

  	settings = ReactionCore.Collections.Packages.findOne(name: "reaction-paypal").settings

  	payflowSettings = {
  		mode: settings.payflow_mode
  		enabled: settings.payflow_enabled
    }

  	return payflowSettings
