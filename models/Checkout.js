const mongoose = require("mongoose");

const checkoutItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },

  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Seller",
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
    min: 1,
  },

  priceAtTimeOfPurchase: {
    type: Number,
    required: true,
  },
});

const checkoutShcema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [checkoutItemSchema],

    shippingAddress: {
      postalCode: {
        type: String,
        required: true,
      },

      location: {
        lat: {
          type: Number,
          required: true,
        },
        lng: {
          type: Number,
          required: true,
        },
      },

      address: {
        type: String,
        required: true,
      },

      cityId: {
        type: Number,
        required: true,
      },
    },

    authority: {
      type: String,
      unique: true,
      required: true,
    },

    expiresAt: {
      // TTL -> Time To Live
      type: Date,
      required: true,
      default: () => Date.now() + 60 * 60 * 1000, // 1 Hour from creation
    },
  },
  { timestamps: true }
);

checkoutShcema.virtual("totalPrice").get(function () {
  return this.items.reduce((total, item) => {
    return total + item.priceAtTimeOfPurchase * item.quantity;
  }, 0);
});

checkoutShcema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const model = mongoose.model("Checkout", checkoutShcema);

module.exports = model;
