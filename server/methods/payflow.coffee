# PAYFLOW SERVER METHODS

Meteor.methods
  #submit (sale, authorize)
  paypalSubmit: (transactionType, cardData, paymentData) ->
    check transactionType, String
    check cardData, Object
    check paymentData, Object

    @unblock()

    PayFlow.configure Meteor.Paypal.payflowAccountOptions()
    paymentObj = Meteor.Paypal.paymentObj()
    paymentObj.intent = transactionType
    paymentObj.payer.funding_instruments.push Meteor.Paypal.parseCardData(cardData)
    paymentObj.transactions.push Meteor.Paypal.parsePaymentData(paymentData)

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

  # Capture details of existing auth
  paypalCapture: (transactionId, captureDetails) ->
    check transactionId, String
    check captureDetails, Object

    @unblock()

    PayFlow.configure Meteor.Paypal.payflowAccountOptions()

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

  # For client to know whether payflow form should be shown
  getPayflowSettings: () ->

  	settings = Meteor.Paypal.payflowAccountOptions()

  	payflowSettings =
      mode: settings.payflow_mode
      enabled: settings.payflow_enabled

  	return payflowSettings
