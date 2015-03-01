Router.map ->
  @route 'paypal',
    controller: ShopAdminController
    path: 'dashboard/settings/paypal',
    template: 'paypal'
    waitOn: ->
      return ReactionCore.Subscriptions.Packages

  # Placeholder for express checkout return url
  # @route 'paypalExpressReturn'

  # Placeholder for express checkout cancel url
  # @route 'paypalExpressCancel'
