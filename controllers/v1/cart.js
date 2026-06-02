const { isValidObjectId } = require("mongoose");
const {
  errorResponse,
  successResponse,
} = require("../../helpers/responses.js");
const Cart = require("./../../models/Cart.js");
const Product = require("./../../models/Product.js");
const Seller = require("./../../models/Seller.js");
const {
  addToCartValidator,
  removeFromCartValidator,
} = require("./../../validators/cart.js");

exports.getCart = async (req, res, next) => {
  try {
    const user = req.user;

    const cart = await Cart.findOne({ user: user._id })
      .populate("items.product")
      .populate("items.seller");

    if (!cart) {
      return errorResponse(res, 404, "Cart not found for this user !!");
    }

    return successResponse(res, 200, { cart });
  } catch (err) {
    next(err);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    await addToCartValidator.validate(req.body, { abortEarly: false });

    const user = req.user;
    const { sellerId, productId, quantity } = req.body;

    if (!isValidObjectId(sellerId) || !isValidObjectId(productId)) {
      return errorResponse(res, 400, "Seller or Product id is not correct !!");
    }

    const product = await Product.findById(productId);
    if (!product) {
      return errorResponse(res, 404, "Product not found !!");
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return errorResponse(res, 404, "Seller not found !!");
    }

    const sellerDetails = product.sellers.find(
      (s) => s.seller.toString() === sellerId
    );

    if (!sellerDetails) {
      return errorResponse(res, 400, "Seller does not sell this product !!");
    }

    const cart = await Cart.findOne({ user: user._id });
    const priceAtTimeOfAdding = sellerDetails.price;

    if (!cart) {
      const newCart = await Cart.create({
        user: user._id,
        items: [
          {
            product: productId,
            seller: sellerId,
            quantity,
            priceAtTimeOfAdding,
          },
        ],
      });

      return successResponse(res, 200, {
        cart: newCart,
      });
    }

    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === productId.toString() &&
        item.seller.toString() === sellerId.toString()
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.priceAtTimeOfAdding = priceAtTimeOfAdding;
    } else {
      cart.items.push({
        product: productId,
        seller: sellerId,
        quantity,
        priceAtTimeOfAdding,
      });
    }

    await cart.save();
    return successResponse(res, 200, { cart });
  } catch (err) {
    next(err);
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const user = req.user;
    const { sellerId, productId } = req.body;

    await removeFromCartValidator.validate(req.body, { abortEarly: false });

    const cart = await Cart.findOne({ user: user._id });
    if (!cart) {
      return errorResponse(res, 404, "Cart not found for the user !!");
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId.toString() &&
        item.seller.toString() === sellerId.toString()
    );

    if (itemIndex === -1) {
      return errorResponse(res, 404, "Product not found in your cart !!");
    }

    cart.items.splice(itemIndex, 1);

    await cart.save();

    return successResponse(res, 200, { cart });
  } catch (err) {
    next(err);
  }
};
