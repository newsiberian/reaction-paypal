ReactionCore.registerPackage({
  label: "PayPal",
  name: "reaction-paypal",
  icon: "fa fa-paypal",
  autoEnable: false,
  registry: [
    {
      provides: "dashboard",
      label: "PayPal",
      route: "dashboard/paypal",
      description: "PayPal Payment for Reaction Commerce",
      icon: "fa fa-paypal",
      cycle: "3",
      container: "reaction-paypal"
    }, {
      label: "PayPal Settings",
      route: "dashboard/paypal",
      provides: "settings",
      container: "reaction-paypal",
      template: "paypalSettings"
    }, {
      template: "paypalPaymentForm",
      provides: "paymentMethod"
    }
  ],
  permissions: [
    {
      label: "PayPal",
      permission: "dashboard/payments",
      group: "Shop Settings"
    }
  ]
});
