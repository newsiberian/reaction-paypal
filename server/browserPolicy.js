Meteor.startup(function() {
  BrowserPolicy.content.allowEval();
  BrowserPolicy.content.allowOriginForAll("http://www.paypal.com");
  BrowserPolicy.content.allowOriginForAll("http://www.paypalobjects.com");
  BrowserPolicy.content.allowOriginForAll("https://www.sandbox.paypal.com");
  BrowserPolicy.content.allowOriginForAll("https://www.paypal.com");
  BrowserPolicy.content.allowOriginForAll("https://www.paypalobjects.com");
  return BrowserPolicy.content.allowOriginForAll("https://tracking.qa.paypal.com");
});
