// set logging level
let formatOut = logger.format({
  outputMode: "short",
  levelInString: false
});

ReactionPaypal = {};
ReactionPaypal.Log = logger.bunyan.createLogger({name: "paypal", stream: formatOut});
