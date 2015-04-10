Package.describe({
  summary: "Reaction Paypal - PayPal payments for Reaction Commerce",
  name: "reactioncommerce:reaction-paypal",
  version: "0.5.0",
  git: "https://github.com/reactioncommerce/reaction-paypal.git",
  icon: 'fa fa-paypal'
});

Npm.depends({
  'paypal-rest-sdk': '1.5.0'
});

Package.onUse(function (api, where) {
  api.versionsFrom('METEOR@1.0');
  api.use("meteor-platform@1.2.1");
  api.use("coffeescript");
  api.use("less");
  api.use("http");
  api.use("reactioncommerce:core@0.5.0");

  api.addFiles("server/register.coffee",["server"]); // register as a reaction package
  api.addFiles("server/paypal.coffee",["server"]);

  api.addFiles([
    "common/collections.coffee",
    "common/routing.coffee",
    "lib/paypal.coffee"
  ],["client","server"]);

  api.addFiles([
    "client/init.coffee",
    "client/templates/paypal.html",
    "client/templates/paypal.less",
    "client/templates/paypal.coffee",
    "client/templates/cart/checkout/payment/methods/paypal/paypal.html",
    "client/templates/cart/checkout/payment/methods/paypal/paypal.coffee"
  ],
  ["client"]);

});
