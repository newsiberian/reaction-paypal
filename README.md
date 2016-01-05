reaction-paypal
=============

PayPal Payments for Reaction Commerce.

This is a WIP Meteor package for Reaction Commerce.

```bash
meteor add reactioncommerce:reaction-paypal
```

Pull requests are celebrated, feedback encouraged.

Supports checkout payments with either, or both "Express Checkout" and "PayFlow Pro" payment methods.

https://www.paypal.com/us/webapps/mpp/product-selection

Payflow Pro is supported via the PayPal-Node-SDK (http://paypal.github.io/PayPal-node-SDK/) while Express uses the
NVP (Name/Value Pair) API via raw HTTP (https://developer.paypal.com/docs/classic/api/#ec)

Express is a hybrid checkout method that allows users to pay with their PayPal account without entering payment
details on your site. Thus it is implemented slightly different than other more traditional server-side only methods.

Payflow Payment Gateway handles all major credit and debit cards inline. https://www.paypal.com/webapps/mpp/payflow-payment-gateway while "Express Checkout" is a modal paypal form.  Neither solution has users leaving your checkout process.

> **International Payments** Make sure you check the PayPal documentation for which countries are supported. Express Checkout supports more countries than PayFlow.

**Note about refunding amounts in more than one currency**

If you need to refund an order that was placed in another currency than your default currency, before you do this the
first time you need to log into your merchant panel and "Accept" the payment. There it will ask you if you want to convert
the payment or leave it as a balance in the new currency. You must have a balance in the currency you wish to refund so
leave this payment as a balance. You will need to do this once for every currency you wish to accept. This applies to
both Express and PayFlow Pro methods. If you do not do this the refund will be refused and will not process.



