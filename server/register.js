ReactionCore.registerPackage({
  name: 'reaction-paypal',
  autoEnable: false,
  registry: [
    {
      provides: 'dashboard',
      label: 'PayPal',
      description: 'PayPal Payment for Reaction Commerce',
      icon: 'fa fa-paypal',
      cycle: '3',
      container: 'reaction-paypal'
    }, {
      route: 'paypal',
      provides: 'settings',
      container: 'reaction-paypal'
    }, {
      template: 'paypalPaymentForm',
      provides: 'paymentMethod'
    }
  ],
  permissions: [
    {
      label: 'Pay Pal',
      permission: 'dashboard/payments',
      group: 'Shop Settings'
    }
  ]
});
