Package.describe({
  summary: "Reaction Paypal - PayPal payments for Reaction Commerce",
  name: "reactioncommerce:reaction-paypal",
  version: "0.5.0",
  git: "https://github.com/reactioncommerce/reaction-paypal.git"
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

  api.addFiles([
    "server/register.coffee", // register as a reaction package
    "server/browserPolicy.coffee", // set browser policy to allow PayPal scripts and images
    "server/methods/express.coffee", // server methods for express checkout
    "server/methods/payflow.coffee" // server methods for payflow
  ], "server");

  api.addFiles([
    "common/collections.coffee",
    "common/routing.coffee",
    "lib/paypal.coffee"
  ], ["client", "server"]);

  api.addFiles([
    "client/templates/paypal.less",
    "client/templates/settings/settings.html",
    "client/templates/settings/settings.coffee",
    "client/templates/checkout/checkoutButton.html",
    "client/templates/checkout/checkoutButton.coffee",
    "client/templates/checkout/payflowForm.html",
    "client/templates/checkout/payflowForm.coffee",
    "client/templates/checkout/paymentForm.html",
    "client/templates/checkout/paymentForm.coffee"
  ], "client");

});
