const { successResponse } = require("../../helpers/responses");
const Order = require("./../../models/Order");
const { createPaginationData } = require("./../../utils/index");
const { updateOrderValidator } = require("./../../validators/order");

exports.getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const user = req.user;

    const filters = {
      ...(user.roles.includes("ADMIN") ? {} : { user: user._id }),
    };

    console.log("Filters ->", filters);

    const orders = await Order.find(filters)
      .sort({ createdAt: "desc" })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user")
      .populate("items.product")
      .populate("items.seller");

    const totalOrders = await Order.countDocuments(filters);

    return successResponse(res, 200, {
      orders,
      pagination: createPaginationData(page, limit, totalOrders, "Orders"),
    });
  } catch (err) {
    next(err);
  }
};

exports.updateOrder = async (req, res, next) => {
  try {
    const { postTrackingCode, status } = req.body;
    const { id } = req.params;

    await updateOrderValidator.validate(req.body, { abortEarly: false });

    const order = await Order.findByIdAndUpdate(
      id,
      {
        status,
        postTrackingCode,
      },
      { new: true }
    );

    return successResponse(res, 200, {
      order,
      message: "Order updated successfully :))",
    });
  } catch (err) {
    next(err);
  }
};
