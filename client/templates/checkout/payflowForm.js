/* eslint camelcase: 0 */

function uiEnd(template, buttonText) {
  template.$(".cart-checkout-step *").removeAttr("disabled");
  template.$("#btn-complete-order").text(buttonText);
  return template.$("#btn-processing").addClass("hidden");
}

function paymentAlert(errorMessage) {
  return $(".alert").removeClass("hidden").text(errorMessage);
}

function hidePaymentAlert() {
  return $(".alert").addClass("hidden").text("");
}

function getError(error, detailSubpart) {
  if (error !== null) {
    if (error.response !== null) {
      return error.response[detailSubpart];
    }
  }
}

function handlePaypalSubmitError(error) {
  let results = [];
  let singleError = getError(error, "error_description");
  let serverError = getError(error, "message");
  let errors = getError(error, "response") || [];
  if (singleError) {
    return paymentAlert("Oops! " + singleError);
  } else if (errors.length) {
    for (let i = 0, len = errors.length; i < len; i++) {
      let thisError = errors[i];
      let formattedError = "Oops! " + thisError.issue + ": " + thisError.field.split(/[. ]+/).pop().replace(/_/g, " ");
      results.push(paymentAlert(formattedError));
    }
    return results;
  } else if (serverError) {
    return paymentAlert("Oops! " + serverError);
  }
}

AutoForm.addHooks("paypal-payment-form", {
  onSubmit: function (doc) {
    hidePaymentAlert();
    let template = this.template;
    let payerNamePieces = doc.payerName.split(" ");
    let form = {
      first_name: payerNamePieces[0],
      last_name: payerNamePieces[1],
      number: doc.cardNumber,
      expire_month: doc.expireMonth,
      expire_year: doc.expireYear,
      cvv2: doc.cvv,
      type: getCardType(doc.cardNumber)
    };
    let storedCard = form.type.charAt(0).toUpperCase() + form.type.slice(1) + " " + doc.cardNumber.slice(-4);
    Meteor.Paypal.authorize(form, {
      total: ReactionCore.Collections.Cart.findOne().cartTotal(),
      currency: ReactionCore.Collections.Shops.findOne().currency
    }, function (error, transaction) {
      submitting = false;
      if (error) {
        handlePaypalSubmitError(error);
        uiEnd(template, "Resubmit payment");
      } else {
        if (transaction.saved === true) {
          let normalizedStatus = (function () {
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
          let normalizedMode = (function () {
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
          let paymentMethod = {
            processor: "PayflowPro",
            storedCard: storedCard,
            method: transaction.response.payer.payment_method,
            transactionId: transaction.response.transactions[0].related_resources[0].authorization.id,
            metadata: {
              authorizationId: transaction.response.transactions[0].related_resources[0].authorization.id
            },
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
  beginSubmit: function () {
    this.template.$(".cart-checkout-step *").attr("disabled", true);
    this.template.$("#btn-complete-order").text("Submitting ");
    return this.template.$("#btn-processing").removeClass("hidden");
  },
  endSubmit: function () {
    if (!submitting) {
      return uiEnd(this.template, "Complete your order");
    }
  }
});
