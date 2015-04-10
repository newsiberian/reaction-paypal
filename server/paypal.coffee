PayFlow = Npm.require("paypal-rest-sdk")
Fiber = Npm.require("fibers")
Future = Npm.require("fibers/future")

Meteor.startup ->
  # set browser policy
  BrowserPolicy.content.allowEval() #eval required by in-context express checkout script
  BrowserPolicy.content.allowOriginForAll("http://www.paypal.com")
  BrowserPolicy.content.allowOriginForAll("http://www.paypalobjects.com")
  BrowserPolicy.content.allowOriginForAll("https://www.sandbox.paypal.com")
  BrowserPolicy.content.allowOriginForAll("https://www.paypal.com")
  BrowserPolicy.content.allowOriginForAll("https://www.paypalobjects.com")

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
    check amount, Number
    check description, String
    check currency, String

    options = Meteor.Paypal.expressCheckoutAccountOptions()

    @unblock()

    if options.mode is 'sandbox'
      url = 'https://api-3t.sandbox.paypal.com/nvp'
      redirect = 'https://www.sandbox.paypal.com/cgi-bin/webscr'
    else
      url = 'https://api-3t.paypal.com/nvp'
      redirect = 'https://www.paypal.com/cgi-bin/webscr'

    invoiceNumber = "214325325" # what number should be used here?

    try
      response = HTTP.post url,
        params:
          USER: options.username,
          PWD: options.password,
          SIGNATURE: options.signature,
          SOLUTIONTYPE: 'Mark',
          VERSION: '52.0'
          PAYMENTACTION: 'Authorization'
          AMT: amount
          RETURNURL: options.return_url
          CANCELURL: options.cancel_url
          DESC: description
          NOSHIPPING: 1
          ALLOWNOTE: 1
          CURRENCYCODE: currency
          METHOD: 'SetExpressCheckout'
          INVNUM: invoiceNumber
          CUSTOM: invoiceNumber + '|' + amount + '|' + currency
    catch error
      throw new Meteor.Error(error.message)

    if !response or response.statusCode isnt 200
      throw new Meteor.Error('Bad response from PayPal')

    response = parseResponse response

    console.log response

    if response.ACK isnt 'Success'
      throw new Meteor.Error('ACK ' + response.ACK + ': ' + response.L_LONGMESSAGE0)

    return response.TOKEN

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

parseResponse = (response) ->
  result = {}
  pieces = response.content.split '&'
  pieces.forEach (piece) ->
    subpieces = piece.split '='
    result[subpieces[0]] = decodeURIComponent(subpieces[1])
  return result
