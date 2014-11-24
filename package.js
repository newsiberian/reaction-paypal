Package.describe({
  summary: "Reaction Paypal - PayPal payments for Reaction Commerce",
  name: "reactioncommerce:reaction-paypal",
  version: "0.1.3",
  git: "https://github.com/ongoworks/reaction-paypal.git"
});

Npm.depends({'paypal-rest-sdk': '0.9.3'});

Package.on_use(function (api, where) {
  api.versionsFrom('METEOR@0.9.0');
  api.use([
    "templating",
    "coffeescript",
    "less",
    "reactioncommerce:core@0.2.1"
  ], ["client", "server"]);

  api.add_files([
    "common/register.coffee",
    "common/collections.coffee",
    "lib/paypal.coffee"
  ],["client","server"]);
  api.add_files("server/paypal.coffee",["server"]);
  api.add_files([
    "client/routing.coffee",
    "client/templates/paypal.html",
    "client/templates/paypal.less",
    "client/templates/paypal.coffee",
    "client/templates/cart/checkout/payment/methods/paypal/paypal.html",
    "client/templates/cart/checkout/payment/methods/paypal/paypal.less",
    "client/templates/cart/checkout/payment/methods/paypal/paypal.coffee"
  ],
  ["client"]);

});
