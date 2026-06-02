const { createPayment, verifyPayment } = require("../../services/zarinpal");
const { createCheckoutValidator } = require("../../validators/checkout");
const Cart = require("../../models/Cart");
const Order = require("../../models/Order");
const Product = require("../../models/Product");
const Checkout = require("../../models/Checkout");
const { errorResponse, successResponse } = require("../../helpers/responses");

exports.createCheckout = async (req, res, next) => {
  try {
    const user = req.user;
    const { shippingAddress } = req.body;

    await createCheckoutValidator.validate(req.body, { abortEarly: false });

    const cart = await Cart.findOne({ user: user._id })
      .populate("items.product")
      .populate("items.seller");

    if (!cart?.items?.length) {
      return errorResponse(res, 400, "Cart is empty or not found !!");
    }

    const checkoutItems = [];

    for (const item of cart.items) {
      const { product, seller } = item;

      const sellerDetails = product.sellers.find(
        (sellerInfo) => sellerInfo.seller.toString() === seller._id.toString()
      );

      if (!sellerDetails) {
        return errorResponse(res, 400, "Seller does not sell this product !!");
      }

      checkoutItems.push({
        product: product._id,
        seller: seller._id,
        quantity: item.quantity,
        priceAtTimeOfPurchase: sellerDetails.price,
      });
    }

    const newCheckout = new Checkout({
      user: user._id,
      items: checkoutItems,
      shippingAddress,
    });

    const payment = await createPayment({
      amountInRial: newCheckout.totalPrice,
      description: `سفارش با شناسه ${newCheckout._id}`,
      mobile: "09921558293",
    });

    newCheckout.authority = payment.authority;

    await newCheckout.save();

    return successResponse(res, 201, {
      message: "Checkout created successfully :))",
      checkout: newCheckout,
      paymentUrl: payment.paymentUrl,
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyCheckout = async (req, res, next) => {
  try {
    const { Status, Authority: authority } = req.query;

    const alreadyCreatedOrder = await Order.findOne({ authority });
    if (alreadyCreatedOrder) {
      return errorResponse(res, 400, "Payment already verified !!");
    }

    const checkout = await Checkout.findOne({ authority });
    if (!checkout) {
      return errorResponse(res, 404, "Checkout not found !!");
    }

    const payment = await verifyPayment({
      authority,
      amountInRial: checkout.totalPrice,
    });

    if (![100, 101].includes(payment.code)) {
      return errorResponse(res, 400, "Payment not verified !!");
    }

    const order = new Order({
      user: checkout.user,
      authority: checkout.authority,
      items: checkout.items,
      shippingAddress: checkout.shippingAddress,
    });

    await order.save();

    for (const item of checkout.items) {
      const product = await Product.findById(item.product);

      if (product) {
        const sellerInfo = product.sellers.find(
          (sellerData) =>
            sellerData.seller.toString() === item.seller.toString()
        );

        sellerInfo.stock -= item.quantity;
        await product.save();
      }
    }

    await Cart.findOneAndUpdate({ user: checkout.user }, { items: [] });

    await Checkout.deleteOne({ _id: checkout._id });

    return successResponse(res, 200, {
      message: "Payment verified :))",
      order,
    });
  } catch (err) {
    next(err);
  }
};
