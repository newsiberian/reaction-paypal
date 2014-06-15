###
#  Meteor.settings.paypal =
#    mode: false  #sandbox
#    client_id: ""
#    client_secret: ""
#  see: https://developer.paypal.com/webapps/developer/docs/api/
#  see: https://github.com/paypal/rest-api-sdk-nodejs
###

@PaypalPackageSchema = new SimpleSchema([
  PackageConfigSchema
  {
    "settings.mode":
      type: Boolean
      defaultValue: false
    "settings.client_id":
      type: String
      label: "API Client ID"
      min: 60
    "settings.client_secret":
      type: String
      label: "API Secret"
      min: 60
  }
])
PaypalPackageSchema = @PaypalPackageSchema

@PaypalPaymentSchema = new SimpleSchema
  payerName:
    type: String
    label: "Cardholder name"
  cardNumber:
    type: String
    min: 16
    label: "Card number"
  expireMonth:
    type: String
    max: 2
    label: "Expiration month"
  expireYear:
    type: String
    max: 4
    label: "Expiration year"
  cvv:
    type: String
    max: 4
    label: "CVV"

PaypalPaymentSchema = @PaypalPaymentSchema
###
# Fixture - we always want a record
###
Meteor.startup ->
  unless Packages.findOne({name:"reaction-paypal"})
    Shops.find().forEach (shop) ->
      unless Meteor.settings.paypal
        Meteor.settings.paypal =
          mode: false
          client_id: ""
          client_secret: ""

      Packages.insert
        shopId: shop._id
        name: "reaction-paypal"
        settings: Meteor.settings.paypal
