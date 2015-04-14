Router.map ->
  @route 'paypal',
    controller: ShopAdminController
    path: '/dashboard/settings/paypal'
    template: 'paypalSettings'
    waitOn: ->
      return ReactionCore.Subscriptions.Packages

  # Express checkout return url
  @route 'paypalExpressReturn',
    path: '/paypal/done'
    action: ->
      # TODO Use token to get info about the user and store it for later charging
      # and then continue to order completed screen
      payerId = @params.query.PayerID
      token = @params.query.token
      cart = ReactionCore.Collections.Cart.findOne()
      unless cart then return

      sessionToken =  Session.get "expressToken"
      if sessionToken isnt token
        Session.set "expressToken", token
        Meteor.call 'confirmPaymentAuthorization', cart._id, token, payerId, (error, result) ->
          if error
            msg = error?.error || i18n.t("checkoutPayment.processingError", "There was a problem with your payment.")
            Alerts.add msg, "danger", placement:"paymentMethod"
            console.log error.error
            return

          # Format the transaction to store with order and submit to CartWorkflow
          paymentMethod =
            processor: "Paypal"
            method: 'Paypal Express Checkout'
            transactionId: result.TRANSACTIONID
            amount: result.AMT
            status: result.PAYMENTSTATUS
            mode: "authorize"
            createdAt: new Date(result.ORDERTIME)
            updatedAt: new Date(result.ORDERTIME)
            transactions: [result]

          # Session.set "expressToken", result.TOKEN
          # Store transaction information with order
          # paymentMethod will auto transition to
          # CartWorkflow.paymentAuth() which
          # will create order, clear the cart, and update inventory,
          # and goto order confirmation page
          CartWorkflow.paymentMethod(paymentMethod)
          return

      @render('loading')
      return

  # Express checkout cancel url
  @route 'paypalExpressCancel',
    path: '/paypal/cancel'
    action: ->
      @redirect '/checkout'
