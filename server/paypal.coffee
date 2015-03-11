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

    @unblock()

    wrappedFunc = Meteor.wrapAsync(PayFlow.payment.create, PayFlow.payment)

    try
      result =
        saved: true
        response: wrappedFunc(paymentObj)
    catch err
      ReactionCore.Events.warn err
      result =
        saved: false
        error: err

    return result

  # capture (existing authorization)
  paypalCapture: (transactionId, captureDetails) ->
    check transactionId, String
    check captureDetails, Object

    PayFlow.configure Meteor.Paypal.payflowAccountOptions()

    @unblock()

    wrappedFunc = Meteor.wrapAsync(PayFlow.authorization.capture, PayFlow.authorization)

    try
      result =
        saved: true
        response: wrappedFunc(transactionId, captureDetails)
    catch err
      ReactionCore.Events.warn err
      result =
        saved: false
        error: err

    return result

  expressCheckoutPay: (amount, description, currency) ->
    check amount, String
    check description, String
    check currency, String

    options = Meteor.Paypal.expressCheckoutAccountOptions()

    @unblock()

    pp = PayPalCheckout.init(options.username, options.password, options.signature, options.return_url, options.cancel_url);
    invoiceNumber = "214325325" # what number should be used here?

    wrappedFunc = Meteor.wrapAsync(pp.pay, pp)

    try
      result =
        saved: true
        url: wrappedFunc(invoiceNumber, amount, description, currency)
    catch err
      ReactionCore.Events.warn err
      result =
        saved: false
        error: err

    return result

  # used by pay with paypal button on the client
  getExpressCheckoutSettings: () ->

  	settings = ReactionCore.Collections.Packages.findOne(name: "reaction-paypal").settings

  	expressCheckoutSettings =
      merchant_id: settings.merchant_id
      mode: settings.express_mode
      enabled: settings.express_enabled

  	return expressCheckoutSettings

  # used by pay with paypal button on the client
  getPayflowSettings: () ->

  	settings = ReactionCore.Collections.Packages.findOne(name: "reaction-paypal").settings

  	payflowSettings =
      mode: settings.payflow_mode
      enabled: settings.payflow_enabled

  	return payflowSettings
