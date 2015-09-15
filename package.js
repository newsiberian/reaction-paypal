Package.describe({
  summary: "Reaction Paypal - PayPal payments for Reaction Commerce",
  name: "reactioncommerce:reaction-paypal",
  version: "1.0.1",
  git: "https://github.com/reactioncommerce/reaction-paypal.git"
});

Npm.depends({
  'paypal-rest-sdk': '1.6.1'
});

Package.onUse(function (api, where) {
  api.versionsFrom('METEOR@1.1.0.2');
  api.use("meteor-platform");
  api.use("less");
  api.use("http");
  api.use("reactioncommerce:core@0.7.0");

  api.addFiles([
    "server/register.js", // register as a reaction package
    "server/browserPolicy.js", // set browser policy to allow PayPal scripts and images
    "server/methods/express.js", // server methods for express checkout
    "server/methods/payflow.js" // server methods for payflow
  ], "server");

  api.addFiles([
    "common/collections.js",
    "common/router.js",
    "lib/paypal.js"
  ], ["client", "server"]);

  api.addFiles([
    "client/templates/paypal.less",
    "client/templates/settings/settings.html",
    "client/templates/settings/settings.js",
    "client/templates/dashboard/dashboard.html",
    "client/templates/dashboard/dashboard.js",
    "client/templates/checkout/checkoutButton.html",
    "client/templates/checkout/checkoutButton.js",
    "client/templates/checkout/payflowForm.html",
    "client/templates/checkout/payflowForm.js",
    "client/templates/checkout/paymentForm.html",
    "client/templates/checkout/paymentForm.js"
  ], "client");

});
