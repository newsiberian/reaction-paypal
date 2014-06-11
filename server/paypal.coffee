PayPal = Npm.require("paypal-rest-sdk")
Fiber = Npm.require("fibers")
Future = Npm.require("fibers/future")

Meteor.methods
  #submit (sale, authorize)
  paypalSubmit: (transaction_type, cardData, paymentData) ->
    PayPal.configure Meteor.Paypal.account_options()
    payment_json = Meteor.Paypal.payment_json()
    payment_json.intent = transaction_type
    payment_json.payer.funding_instruments.push Meteor.Paypal.parseCardData(cardData)
    payment_json.transactions.push Meteor.Paypal.parsePaymentData(paymentData)
    fut = new Future()
    @unblock()
    PayPal.payment.create payment_json, Meteor.bindEnvironment((err, payment) ->
      if err
        fut.return
          saved: false
          error: err
      else
        fut.return
          saved: true
          payment: payment
      return
    , (e) ->
      console.error e
      return
    )
    fut.wait()


  # capture (existing authorization)
  paypalCapture: (transactionId, capture_details) ->
    PayPal.configure Meteor.Paypal.account_options()
    fut = new Future()
    @unblock()
    PayPal.authorization.capture transactionId, capture_details, (error, capture) ->
      if error
        fut.return
          saved: false
          error: error
      else
        fut.return
          saved: true
          capture: capture
      return
    fut.wait()
return