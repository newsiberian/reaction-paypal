Meteor.startup ->
  # set browser policy
  BrowserPolicy.content.allowEval() #eval required by in-context express checkout script
  BrowserPolicy.content.allowOriginForAll("http://www.paypal.com")
  BrowserPolicy.content.allowOriginForAll("http://www.paypalobjects.com")
  BrowserPolicy.content.allowOriginForAll("https://www.sandbox.paypal.com")
  BrowserPolicy.content.allowOriginForAll("https://www.paypal.com")
  BrowserPolicy.content.allowOriginForAll("https://www.paypalobjects.com")
  BrowserPolicy.content.allowOriginForAll("https://tracking.qa.paypal.com")
