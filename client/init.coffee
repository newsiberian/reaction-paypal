containerElement = null
ready = false
setupDone = false

doSetup = ->
  if containerElement and ready and not setupDone
    setupDone = true
    paypal.checkout.setup 'SU579KES65GEN',
      environment: Meteor.Paypal.expressCheckoutAccountOptions().mode
      locale: ReactionCore.Locale.language.replace('-', '_')
      container: containerElement
      click: ->
        paypal.checkout.initXO();

        shop = ReactionCore.Collections.Shops.findOne()
        cart = ReactionCore.Collections.Cart.findOne()

        Meteor.call "getExpressCheckoutToken", Number(cart.cartTotal()), shop.name, shop.currency, (error, token) ->
          if error
            console.log error
            paypal.checkout.closeFlow()
          else
            url = paypal.checkout.urlPrefix + token;
            paypal.checkout.startFlow url

window.paypalCheckoutReady = ->
  ready = true
  doSetup()

Meteor.Paypal.initExpress = (element) ->
  containerElement = element
  doSetup()
