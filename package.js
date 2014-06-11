Package.describe({
  summary: "Reaction Paypal - Paypal payments for Reaction Commerce"
});

Npm.depends({'paypal-rest-sdk': '0.8.0'});

Package.on_use(function (api, where) {
  api.use([
    "templating",
    "coffeescript",
    "iron-router",
    "simple-schema",
    "autoform",
    "underscore-string-latest",
    "less",
    "reaction-core"
  ], ["client", "server"]);

  api.add_files("common/collections.coffee",["client","server"]);
  api.add_files("lib/paypal.coffee",["client","server"]);
  api.add_files("server/paypal.coffee",["server"]);
  api.add_files([
    "client/routing.coffee",
    "client/register.coffee",
    "client/templates/paypal.html",
    "client/templates/paypal.less",
    "client/templates/paypal.coffee",
    "client/templates/cart/checkout/payment/methods/paypal/paypal.html",
    "client/templates/cart/checkout/payment/methods/paypal/paypal.less",
    "client/templates/cart/checkout/payment/methods/paypal/paypal.coffee"
  ],
  ["client"]);

  api.export([
    "PaypalPackageSchema",
  ], ["client", "server"]);

});
