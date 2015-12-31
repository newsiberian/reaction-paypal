Router.map(function () {
  this.route("dashboard/paypal", {
    controller: ShopAdminController,
    path: "/dashboard/paypal",
    template: "paypalDashboard",
    waitOn: function () {
      return ReactionCore.Subscriptions.Packages;
    }
  });
  this.route("paypalExpressReturn", {
    path: "/paypal/done",
    yieldTemplates: {
      checkoutHeader: {
        to: "layoutHeader"
      }
    },
    onBeforeAction: function () {
      let payerId = this.params.query.PayerID;
      let token = this.params.query.token;
      let cart = ReactionCore.Collections.Cart.findOne();
      if (!cart) {
        return;
      }
      let sessionToken = Session.get("expressToken");
      if (sessionToken !== token) {
        Session.set("expressToken", token);
        Meteor.call("confirmPaymentAuthorization", cart._id, token, payerId, function (error, result) {
          if (error) {
            console.log(error);
            let msg = (error !== null ? error.error : void 0) || i18n.t("checkoutPayment.processingError",
                "There was a problem with your payment.");
            Alerts.add(msg, "danger", {
              placement: "paymentMethod"
            });
            if (isDuplicate(error)) {
              Router.go("cartCompleted", {
                _id: cart._id
              });
            }
            return;
          }
          let status;
          // Normalize status to be 'created' for new orders
          if (result.PAYMENTSTATUS === "Pending") {
            status = "created";
          } else {
            status = result.PAYMENTSTATUS;
          }

          let paymentMethod = {
            processor: "PaypalExpress",
            method: "Paypal Express Checkout",
            transactionId: result.TRANSACTIONID,
            amount: parseFloat(result.AMT, 10),
            status: status,
            mode: "authorize",
            createdAt: new Date(result.ORDERTIME),
            updatedAt: new Date(result.ORDERTIME),
            transactions: [result]
          };
          try {
            Meteor.call("cart/submitPayment", paymentMethod);
          } catch (_error) {
            e = _error;
            Session.set("guestCheckoutFlow", true);
            Router.go("cartCheckout");
          }
        });
      }
      this.render("loading");
    }
  });
  return this.route("paypalExpressCancel", {
    path: "/paypal/cancel",
    action: function () {
      Session.set("guestCheckoutFlow", true);
      return this.redirect("/checkout");
    }
  });
});

// If the error we got was that we already processed this transaction let's go ahead and move forward
function isDuplicate(error) {
  let errorMessage = error.message;
  let duplicateErrorCode = "10415";
  return errorMessage.indexOf(duplicateErrorCode) > -1;
}
