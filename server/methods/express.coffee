# EXPRESS CHECKOUT SERVER METHODS

Meteor.methods

  # This is called upon clicking the PayPal express checkout
  # button, and the resulting token must be passed to the
  # PayPal in-context checkout script.
  getExpressCheckoutToken: (cartId) ->
    check cartId, String

    @unblock()

    cart = ReactionCore.Collections.Cart.findOne cartId

    unless cart
      throw new Meteor.Error 'Bad cart ID'

    shop = ReactionCore.Collections.Shops.findOne cart.shopId

    unless shop
      throw new Meteor.Error 'Bad shop ID'

    amount = Number(cart.cartTotal())
    description = "#{shop.name} Ref: #{cartId}"
    currency = shop.currency

    options = Meteor.Paypal.expressCheckoutAccountOptions()

    try
      response = HTTP.post options.url,
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
          INVNUM: cartId
          CUSTOM: cartId + '|' + amount + '|' + currency
    catch error
      throw new Meteor.Error(error.message)

    if !response or response.statusCode isnt 200
      throw new Meteor.Error('Bad response from PayPal')

    response = parseResponse response

    if response.ACK isnt 'Success'
      throw new Meteor.Error('ACK ' + response.ACK + ': ' + response.L_LONGMESSAGE0)

    return response.TOKEN

  # After the PayPal in-context checkout flow redirects to the
  # return URL, we call this with the token and payerId it
  # provides. Here we confirm the authorization.
  confirmPaymentAuthorization: (cartId, token, payerId) ->
    check cartId, String
    check token, String
    check payerId, String

    @unblock()

    cart = ReactionCore.Collections.Cart.findOne cartId

    unless cart
      throw new Meteor.Error 'Bad cart ID'

    amount = Number(cart.cartTotal())

    options = Meteor.Paypal.expressCheckoutAccountOptions()

    try
      response = HTTP.post options.url,
        params:
          USER: options.username,
          PWD: options.password,
          SIGNATURE: options.signature,
          VERSION: '52.0'
          PAYMENTACTION: 'Authorization'
          AMT: amount
          METHOD: 'DoExpressCheckoutPayment'
          TOKEN: token
          PAYERID: payerId
    catch error
      throw new Meteor.Error(error.message)

    if !response or response.statusCode isnt 200
      throw new Meteor.Error('Bad response from PayPal')

    response = parseResponse response

    if response.ACK isnt 'Success'
      throw new Meteor.Error('ACK ' + response.ACK + ': ' + response.L_LONGMESSAGE0)

    return response

  # used by pay with paypal button on the client
  getExpressCheckoutSettings: () ->

  	settings = Meteor.Paypal.expressCheckoutAccountOptions()

  	expressCheckoutSettings =
      merchantId: settings.merchantId
      mode: settings.mode
      enabled: settings.enabled

  	return expressCheckoutSettings

# PRIVATE

parseResponse = (response) ->
  result = {}
  pieces = response.content.split '&'
  pieces.forEach (piece) ->
    subpieces = piece.split '='
    result[subpieces[0]] = decodeURIComponent(subpieces[1])
  return result
