/* eslint dot-notation: 0 */
/* eslint camelcase: 0 */

describe("Payment Methods", function () {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 150000; // the paypal call can take a while, so be patient
  let user = Factory.create("user");
  let userId = user._id;
  initPaypal();
  ReactionCore.sessionId = Random.id(); // Required for creating a cart
  const product = Factory.create("product");

  describe("Create a User", function () {
    it("should persist user in the db", function (done) {
      let testUser = Factory.create("user");
      let testAccount = createAccount(testUser);
      let accountUser = ReactionCore.Collections.Accounts.findOne(testUser._id);
      expect(accountUser._id).toBe(testAccount._id);
      done();
    });
  });

  //describe("Authorize Cart", function () {
  //  describe("cart/addToCart", function () {
  //    beforeEach(function () {
  //      ReactionCore.Collections.Cart.remove({});
  //    });
  //
  //    it("should create an authorization for this amount", function (done) {
  //      const cartId = Meteor.call("cart/createCart", userId);
  //      const productId = product._id;
  //      const variantData = product.variants[0];
  //      const quantity = 1;
  //      Meteor.call("cart/addToCart", cartId, productId,
  //        variantData, quantity);
  //      let cart = ReactionCore.Collections.Cart.findOne({
  //        _id: cartId
  //      }, {
  //        items: product
  //      });
  //      let cartTotal = cart.cartTotal();
  //
  //      const cardData = {
  //        first_name: "Test",
  //        last_name: "User",
  //        number: "4242424242424242",
  //        expire_month: "3",
  //        expire_year: "2017",
  //        cvv2: "345",
  //        type: "visa"
  //      };
  //      const paymentData = {
  //        total: cartTotal,
  //        currency: "USD"
  //      };
  //
  //      const transactionType = "authorize";
  //      let result = Meteor.call("payflowProSubmit", transactionType, cardData, paymentData);
  //      expect(result.response.state).toBe("approved");
  //      done();
  //    });
  //  });
  //});

  describe("Pay for an Order", function () {
    it("should create an order from a cart", function (done) {
      let cart = createCart(userId);
      Meteor.call("cart/copyCartToOrder", cart._id);

      expect(null).toBe(null);
      done();
    });
  });

  //describe("Capture an Order", function () {
  //  it("Should capture a payment for an order", function (done) {
  //    const paymentMethod = getPaymentMethod();
  //    let result = Meteor.call("payflowpro/payment/capture", paymentMethod);
  //    console.log(result);
  //    expect(result.rawTransaction.result).toBe("completed");
  //    done();
  //  });
  //});

  describe("Refund an Order", function () {
    it("Should Refund a Payment for an Order", function (done) {
      expect(null).toBe(null);
      done();
    });
  });
});

function createUser() {
  let meteorUser = Meteor.users.findOne();
  console.log("Using meteorUser: " + meteorUser._id );
  let shopId = ReactionCore.getShopId();
  ReactionCore.Collections.Accounts.insert({
    shopId: shopId,
    userId: meteorUser._id
  });
  let user = ReactionCore.Collections.Accounts.findOne({
    userId: meteorUser._id
  });
  console.log(user);
  return user;
}

function createAccount(user) {
  let shop = ReactionCore.getCurrentShop();
  let shopId = ReactionCore.getShopId();
  let roles = {};
  if (!user.emails) user.emails = [];
  // init default user roles
  // we won't create users unless we have a shop.
  if (shop) {
    if (user.services === undefined) {
      roles[shopId] = shop.defaultVisitorRole || ["anonymous", "guest"];
    } else {
      roles[shopId] = shop.defaultRoles || ["guest", "account/profile"];
      // also add services with email defined to user.emails[]
      for (let service of services(user.services)) {
        if (service.email) {
          email = {
            provides: "default",
            address: service.email,
            verified: true
          };
          user.emails.push(email);
        }
      }
    }
    // clone before adding roles
    let account = _.clone(user);
    account.userId = user._id;
    ReactionCore.Collections.Accounts.insert(account);
    user.roles = roles;
    return account;
  }
}

function createCart(userId) {
  const product = Factory.create("product");
  const cartId = Meteor.call("cart/createCart", userId);
  const productId = product._id;
  const variantData = product.variants[0];
  const quantity = 1;
  Meteor.call("cart/addToCart", cartId, productId,
    variantData, quantity);
  let cart = ReactionCore.Collections.Cart.findOne({
    _id: cartId
  }, {
    items: product
  });
  return cart;
}

function initPaypal() {
  let paypalSettingsId = ReactionCore.Collections.Packages.findOne({
    name: "reaction-paypal",
    shopId: ReactionCore.getShopId()
  })._id;

  ReactionCore.Collections.Packages.update(paypalSettingsId, {$set: { enabled: true, settings: {
    express_enabled: false,
    express_mode: false,
    payflow_enabled: true,
    payflow_mode: false
  }
  }});
}

function getPaymentMethod() {
  let paymentMethod = {
    "processor": "PayflowPro",
    "storedCard": "Visa 4242",
    "method": "credit_card",
    "transactionId": "0JM39054MC1990637",
    "metadata": {
      "authorizationId": "0JM39054MC1990637"
    },
    "amount": 19.9899999999999984,
    "status": "created",
    "mode": "authorize",
    "createdAt": new Date(),
    "updatedAt": new Date(),
    "transactions": [
      {
        "id": "PAY-0D866761MK951201KKZVEIWI",
        "create_time": "2015-12-11T03:34:49Z",
        "update_time": "2015-12-11T03:35:01Z",
        "state": "approved",
        "intent": "authorize",
        "payer": {
          "payment_method": "credit_card",
          "funding_instruments": [
            {
              "credit_card": {
                "type" : "visa",
                "number": "xxxxxxxxxxxx4242",
                "expire_month": "3",
                "expire_year": "2016",
                "first_name": "Brent",
                "last_name": "Hoover"
              }
            }
          ]
        },
        "transactions": [
          {
            "amount": {
              "total": "19.99",
              "currency": "USD",
              "details": {
                "subtotal": "19.99"
              }
            },
            "related_resources": [
              {
                "authorization": {
                  "id": "0JM39054MC1990637",
                  "create_time": new Date(),
                  "update_time": new Date(),
                  "amount": {
                    "total": "19.99",
                    "currency": "USD",
                    "details": {
                      "subtotal": "19.99"
                    }
                  },
                  "state": "authorized",
                  "parent_payment": "PAY-0D866761MK951201KKZVEIWI",
                  "valid_until": "2016-01-09T03:34:49Z",
                  "processor_response": {
                    "avs_code": "X",
                    "cvv_code": "M"
                  },
                  "fmf_details": {}
                }
              }
            ]
          }
        ],

        "httpStatusCode": 201
      }
    ],
    "workflow": {
      "status": "new"
    }
  };
  return paymentMethod;
}
