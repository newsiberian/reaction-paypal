ReactionCore.registerPackage
  name: 'reaction-paypal' # usually same as meteor package
  autoEnable: false # auto-enable in dashboard
  settings: # private package settings config (blackbox)
    mode: false
    client_id: ''
    client_secret: ''
  registry: [
    # all options except route and template
    # are used to describe the
    # dashboard 'app card'.
    {
      provides: 'dashboard'
      label: 'PayPal'
      description: 'PayPal Payment for Reaction Commerce'
      icon: 'fa fa-paypal' # glyphicon/fa
      cycle: '3' # Core, Stable, Testing (currently testing)
      container: 'reaction-paypal'  #group this with settings
    }
    # configures settings link for app card
    # use 'group' to link to dashboard card
    {
      route: 'paypal'
      provides: 'settings'
      container: 'reaction-paypal'
    }
    # configures template for checkout
    # paymentMethod dynamic template
    {
      template: 'paypalPaymentForm'
      provides: 'paymentMethod'
    }
  ]
  # array of permission objects
  permissions: [
    {
      label: 'Pay Pal'
      permission: 'dashboard/payments'
      group: 'Shop Settings'
    }
  ]
