containerElement = null
ready = false
expressCheckoutSettings = null

doSetup = ->
  if containerElement and ready and expressCheckoutSettings and expressCheckoutSettings.enabled
    # It's OK to call this multiple times and we want to re-call it whenever
    # the checkout button template is rendered because the image button will
    # need to be re-added
    paypal.checkout.setup expressCheckoutSettings.merchantId,
      environment: expressCheckoutSettings.mode
      # TODO: convert user locale to https://developer.paypal.com/docs/classic/api/locale_codes/
      # locale: ReactionCore.Locale.language.replace('-', '_')
      container: containerElement
      click: ->
        paypal.checkout.initXO()

        cart = ReactionCore.Collections.Cart.findOne()
        unless cart then return

        Meteor.call "getExpressCheckoutToken", cart._id, (error, token) ->
          if error
            msg = error?.error || i18n.t("checkoutPayment.processingError", "There was a problem with your payment.")
            Alerts.add msg, "danger", placement:"paymentMethod"
            paypal.checkout.closeFlow()
          else
            url = paypal.checkout.urlPrefix + token;
            paypal.checkout.startFlow url

window.paypalCheckoutReady = ->
  ready = true
  doSetup()

Tracker.autorun () ->
  expressCheckoutSettings = Session.get 'expressCheckoutSettings'
  doSetup()

Template.paypalCheckoutButton.onRendered ->
  containerElement = this.$('.paypal-checkout-button-container')[0]
  doSetup()
