uiEnd = (template, buttonText) ->
  template.$(".cart-checkout-step *").removeAttr("disabled")
  template.$("#btn-complete-order").text(buttonText)
  template.$("#btn-processing").addClass("hidden")

paymentAlert = (errorMessage) ->
  $(".alert").removeClass("hidden").text(errorMessage)

hidePaymentAlert = () ->
  $(".alert").addClass("hidden").text('')

handlePaypalSubmitError = (error) ->
  # Depending on what they are, errors come back from PayPal in various formats
  singleError = error?.response?.error_description
  serverError = error?.response?.message
  errors = error?.response?.details || []
  if singleError
    paymentAlert("Oops! " + singleError)
  else if errors.length
    for error in errors
      formattedError = "Oops! " + error.issue + ": " + error.field.split(/[. ]+/).pop().replace(/_/g,' ')
      paymentAlert(formattedError)
  else if serverError
    paymentAlert("Oops! " + serverError)

Template.paypalPaymentForm.helpers
# used to track asynchronous submitting for UI changes
submitting = false

AutoForm.addHooks "paypal-payment-form",
  onSubmit: (doc) ->
    # Process form (pre-validated by autoform)
    submitting = true
    template = this.template
    hidePaymentAlert()

    # regEx in the schema ensures that there will be exactly two names with one space between
    payerNamePieces = doc.payerName.split " "

    # Format data for paypal
    form = {
      first_name: payerNamePieces[0]
      last_name: payerNamePieces[1]
      number: doc.cardNumber
      expire_month: doc.expireMonth
      expire_year: doc.expireYear
      cvv2: doc.cvv
      type: getCardType(doc.cardNumber)
    }

    # Reaction only stores type and 4 digits
    storedCard = form.type.charAt(0).toUpperCase() + form.type.slice(1) + " " + doc.cardNumber.slice(-4)

    # Submit for processing
    Meteor.Paypal.authorize form,
      total: ReactionCore.Collections.Cart.findOne().cartTotal()
      currency: Shops.findOne().currency
    , (error, transaction) ->
      submitting = false
      if error
        # this only catches connection/authentication errors
        handlePaypalSubmitError(error)
        # Hide processing UI
        uiEnd(template, "Resubmit payment")
        return
      else
        if transaction.saved is true #successful transaction

          # Normalize status
          normalizedStatus = switch transaction.response.state
            when "created" then "created"
            when "approved" then "created"
            when "failed" then "failed"
            when "canceled" then "canceled"
            when "expired" then "expired"
            when "pending" then "pending"
            else "failed"

          # Normalize mode
          normalizedMode = switch transaction.response.intent
            when "sale" then "capture"
            when "authorize" then "authorize"
            when "order" then "capture"
            else "capture"

          # Format the transaction to store with order and submit to CartWorkflow
          paymentMethod =
            processor: "Paypal"
            storedCard: storedCard
            method: transaction.response.payer.payment_method
            transactionId: transaction.response.transactions[0].related_resources[0].authorization.id
            amount: transaction.response.transactions[0].amount.total
            status: normalizedStatus
            mode: normalizedMode
            createdAt: new Date(transaction.response.create_time)
            updatedAt: new Date(transaction.response.update_time)
            transactions: []
          paymentMethod.transactions.push transaction.response

          # Store transaction information with order
          # paymentMethod will auto transition to
          # CartWorkflow.paymentAuth() which
          # will create order, clear the cart, and update inventory,
          # and goto order confirmation page
          CartWorkflow.paymentMethod(paymentMethod)
          return
        else # card errors are returned in transaction
          handlePaypalSubmitError(transaction.error)
          # Hide processing UI
          uiEnd(template, "Resubmit payment")
          return

    return false;

  beginSubmit: (formId, template) ->
    # Show Processing
    template.$(".cart-checkout-step *").attr("disabled", true)
    template.$("#btn-complete-order").text("Submitting ")
    template.$("#btn-processing").removeClass("hidden")

  endSubmit: (formId, template) ->
    # Hide processing UI here if form was not valid
    uiEnd(template, "Complete your order") if not submitting
