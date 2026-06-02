const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  title: {
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

  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },

  description: {
    type: String,
    trim: true,
  },

  filters: {
    type: [
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
          trim: true,
        },

        type: {
          type: String,
          enum: ["radio", "selectbox"],
          required: true,
        },

        options: {
          type: [String],
          default: undefined,
          validate: {
            validator: (options) => Array.isArray(options),
          },
        },

        min: { type: Number },
        max: { type: Number },
      },
    ],
  },
});

module.exports = mongoose.model("SubCategory", categorySchema);
