var handlePaypalSubmitError, hidePaymentAlert, paymentAlert, submitting, uiEnd;

uiEnd = function(template, buttonText) {
  template.$(".cart-checkout-step *").removeAttr("disabled");
  template.$("#btn-complete-order").text(buttonText);
  return template.$("#btn-processing").addClass("hidden");
};

paymentAlert = function(errorMessage) {
  return $(".alert").removeClass("hidden").text(errorMessage);
};

hidePaymentAlert = function() {
  return $(".alert").addClass("hidden").text('');
};

handlePaypalSubmitError = function(error) {
  var errors, formattedError, i, len, ref, ref1, ref2, results, serverError, singleError;
  singleError = error != null ? (ref = error.response) != null ? ref.error_description : void 0 : void 0;
  serverError = error != null ? (ref1 = error.response) != null ? ref1.message : void 0 : void 0;
  errors = (error != null ? (ref2 = error.response) != null ? ref2.details : void 0 : void 0) || [];
  if (singleError) {
    return paymentAlert("Oops! " + singleError);
  } else if (errors.length) {
    results = [];
    for (i = 0, len = errors.length; i < len; i++) {
      error = errors[i];
      formattedError = "Oops! " + error.issue + ": " + error.field.split(/[. ]+/).pop().replace(/_/g, ' ');
      results.push(paymentAlert(formattedError));
    }
    return results;
  } else if (serverError) {
    return paymentAlert("Oops! " + serverError);
  }
};

submitting = false;

AutoForm.addHooks("paypal-payment-form", {
  onSubmit: function(doc) {
    var form, payerNamePieces, storedCard, template;
    submitting = true;
    template = this.template;
    hidePaymentAlert();
    payerNamePieces = doc.payerName.split(" ");
    form = {
      first_name: payerNamePieces[0],
      last_name: payerNamePieces[1],
      number: doc.cardNumber,
      expire_month: doc.expireMonth,
      expire_year: doc.expireYear,
      cvv2: doc.cvv,
      type: getCardType(doc.cardNumber)
    };
    storedCard = form.type.charAt(0).toUpperCase() + form.type.slice(1) + " " + doc.cardNumber.slice(-4);
    Meteor.Paypal.authorize(form, {
      total: ReactionCore.Collections.Cart.findOne().cartTotal(),
      currency: Shops.findOne().currency
    }, function(error, transaction) {
      var normalizedMode, normalizedStatus, paymentMethod;
      submitting = false;
      if (error) {
        handlePaypalSubmitError(error);
        uiEnd(template, "Resubmit payment");
      } else {
        if (transaction.saved === true) {
          normalizedStatus = (function() {
            switch (transaction.response.state) {
              case "created":
                return "created";
              case "approved":
                return "created";
              case "failed":
                return "failed";
              case "canceled":
                return "canceled";
              case "expired":
                return "expired";
              case "pending":
                return "pending";
              default:
                return "failed";
            }
          })();
          normalizedMode = (function() {
            switch (transaction.response.intent) {
              case "sale":
                return "capture";
              case "authorize":
                return "authorize";
              case "order":
                return "capture";
              default:
                return "capture";
            }
          })();
          paymentMethod = {
            processor: "Paypal",
            storedCard: storedCard,
            method: transaction.response.payer.payment_method,
            transactionId: transaction.response.transactions[0].related_resources[0].authorization.id,
            amount: Number(transaction.response.transactions[0].amount.total),
            status: normalizedStatus,
            mode: normalizedMode,
            createdAt: new Date(transaction.response.create_time),
            updatedAt: new Date(transaction.response.update_time),
            transactions: []
          };
          paymentMethod.transactions.push(transaction.response);

          Meteor.call("cart/submitPayment", paymentMethod);

        } else {
          handlePaypalSubmitError(transaction.error);
          uiEnd(template, "Resubmit payment");
        }
      }
    });
    return false;
  },
  beginSubmit: function() {
    this.template.$(".cart-checkout-step *").attr("disabled", true);
    this.template.$("#btn-complete-order").text("Submitting ");
    return this.template.$("#btn-processing").removeClass("hidden");
  },
  endSubmit: function() {
    if (!submitting) {
      return uiEnd(this.template, "Complete your order");
    }
  }
});
