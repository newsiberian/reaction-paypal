ReactionCore.registerPackage({
  label: 'PayPal',
  name: 'reaction-paypal',
  autoEnable: false,
  registry: [
    {
      provides: 'dashboard',
      label: 'PayPal',
      route: 'paypal',
      description: 'PayPal Payment for Reaction Commerce',
      icon: 'fa fa-paypal',
      cycle: '3',
      container: 'reaction-paypal'
    }, {
      label: 'PayPal Settings',
      i18nLabel: 'app.paypalSettings',
      provides: 'settings',
      container: 'reaction-paypal',
      template: 'paypalSettings'
    }, {
      template: 'paypalPaymentForm',
      provides: 'paymentMethod'
    }
  ],
  permissions: [
    {
      label: 'PayPal',
      permission: 'dashboard/payments',
      group: 'Shop Settings'
    }
  ]
});
