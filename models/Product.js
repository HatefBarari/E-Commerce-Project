const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Seller",
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  stock: {
    type: Number,
    required: true,
  },
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: true,
    },

    images: {
      type: [
        {
          type: String,
          required: true,
        },
      ],
    },

    sellers: {
      type: [sellerSchema],
    },

    filterValues: {
      type: Map, //   Map -> Key - Value Pair
      of: mongoose.Types.Mixed,
      required: true,
    },

    customFilters: {
      type: Map,
      of: String,
      required: true,
    },

    shortIdentifier: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
