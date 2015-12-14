Package.describe({
  summary: "Reaction Paypal - PayPal payments for Reaction Commerce",
  name: "reactioncommerce:reaction-paypal",
  version: "1.2.5",
  git: "https://github.com/reactioncommerce/reaction-paypal.git"
});

Npm.depends({
  "paypal-rest-sdk": "1.6.6"
});

Package.onUse(function (api) {
  api.versionsFrom("METEOR@1.2");

  // meteor base packages
  api.use("meteor-base");
  api.use("mongo");
  api.use("blaze-html-templates");
  api.use("session");
  api.use("jquery");
  api.use("tracker");
  api.use("logging");
  api.use("reload");
  api.use("random");
  api.use("ejson");
  api.use("spacebars");
  api.use("check");
  api.use("ecmascript");
  api.use("less");
  api.use("http");

  api.use("reactioncommerce:core@0.9.2");

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

Package.onTest(function (api) {
  api.use("underscore");
  api.use("random");
  api.use("sanjo:jasmine@0.20.3");
  api.use("velocity:html-reporter@0.9.1");

  api.use("velocity:console-reporter@0.1.4");
  api.use("accounts-base");
  api.use("accounts-password");
  // reaction core
  api.use("reactioncommerce:reaction-accounts");
  api.use("reactioncommerce:reaction-collections");
  api.use("reactioncommerce:reaction-factories@0.3.3");
  api.use("reactioncommerce:core");
  api.use("reactioncommerce:reaction-sample-data");
  api.use("reactioncommerce:reaction-paypal@1.2.5");

  // server integration tests
  api.addFiles("tests/jasmine/server/integration/payflow.js", "server");
  api.export("faker", ["server"]);
});
