ReactionCore.registerPackage
  name: 'reaction-paypal'
  provides: ['paymentMethod']
  paymentTemplate: "paypalPaymentForm"
  label: 'PayPal'
  description: 'Accept PayPal payments'
  icon: 'fa fa-paypal'
  settingsRoute: 'paypal'
  defaultSettings:
    mode: false
    client_id: ""
    client_secret: ""
  priority: '2'
  hasWidget: true
  autoEnable: false
  shopPermissions: [
    {
      label: "Pay Pal"
      permission: "dashboard/payments"
      group: "Shop Settings"
    }
  ]