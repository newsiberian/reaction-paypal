Router.map ->
  @route 'paypal',
    controller: ShopAdminController
    path: '/dashboard/settings/paypal'
    template: 'paypal'
    waitOn: ->
      return ReactionCore.Subscriptions.Packages

  # Express checkout return url
  @route 'paypalExpressReturn',
    path: '/paypal/done'
    action: ->
      # TODO Use token to get info about the user and store it for later charging
      # and then continue to order completed screen
      console.log @params

  # Express checkout cancel url
  @route 'paypalExpressCancel',
    path: '/paypal/cancel'
    action: ->
      @redirect '/checkout'
