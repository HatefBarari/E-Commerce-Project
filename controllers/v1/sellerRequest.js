const {
  createSellerRequestValidator,
  updateSellerRequestValidator,
} = require("./../../validators/sellerRequest");
const Seller = require("./../../models/Seller");
const SellerRequest = require("./../../models/sellerRequest");
const Product = require("./../../models/Product");
const { errorResponse, successResponse } = require("./../../helpers/responses");
const { isValidObjectId } = require("mongoose");
const { createPaginationData } = require("./../../utils/index");

exports.getAllSellerRequests = async (req, res, next) => {
  try {
    const user = req.user;
    const { status = "pending", page = 1, limit = 10 } = req.query;

    const seller = await Seller.findOne({ user: user._id });

    if (!seller) {
      return errorResponse(res, 404, "Seller not found !!");
    }

    const filters = {
      seller: seller._id,
      status,
    };

    const sellerRequests = await SellerRequest.find(filters)
      .sort({
        createdAt: "desc",
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // const totalRequests = await SellerRequest.countDocuments(filters);
    const totalRequests = sellerRequests.length;

    return successResponse(res, 200, {
      sellerRequests,
      pagination: createPaginationData(
        page,
        limit,
        totalRequests,
        "SellerRequests"
      ),
    });
  } catch (err) {
    next(err);
  }
};

exports.createSellerRequest = async (req, res, next) => {
  try {
    const user = req.user;

    await createSellerRequestValidator.validate(req.body, {
      abortEarly: false,
    });

    const { productId, price, stock } = req.body;

    const seller = await Seller.findOne({ user: user._id });

    if (!seller) {
      return errorResponse(res, 404, "Seller not found !!");
    }

    const existingRequest = await SellerRequest.findOne({
      seller: seller._id,
      product: productId,
    });

    if (existingRequest) {
      return errorResponse(res, 400, "Request already exist !!");
    }

    const product = await Product.findById(productId);

    if (!product) {
      return errorResponse(res, 404, "Product not found !!");
    }

    const newSellerRequest = await SellerRequest.create({
      seller: seller._id,
      product: productId,
      price,
      stock,
      status: "pending",
    });

    return successResponse(res, 201, {
      message: "Seller request submitted successfully :))",
      request: newSellerRequest,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateSellerRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminComment } = req.body;

    await updateSellerRequestValidator.validate(
      { status, adminComment },
      {
        abortEarly: false,
      }
    );

    throw new Error("Test Error ");

    const sellerRequest = await SellerRequest.findById(id);

    if (!sellerRequest) {
      return errorResponse(res, 404, "Seller request not found !!");
    }

    if (status === "reject") {
      sellerRequest.status = "rejected";
      if (adminComment) {
        sellerRequest.adminComment = adminComment;
      }

      await sellerRequest.save();

      return successResponse(res, 200, {
        message: "Seller request rejected !!",
        sellerRequest,
      });
    } else if (status === "accept") {
      const product = await Product.findById(sellerRequest.product);
      if (!product) {
        return errorResponse(res, 404, "Product not found !!");
      }

      const existingProductSeller = product.sellers.find(
        (seller) => seller.seller.toString() === sellerRequest.seller.toString()
      );

      if (existingProductSeller) {
        return errorResponse(
          res,
          400,
          "Seller already exists for this product !!"
        );
      }

      product.sellers.push({
        seller: sellerRequest.seller,
        stock: sellerRequest.stock,
        price: sellerRequest.price,
      });

      await product.save();

      sellerRequest.status = "accepted";

      await sellerRequest.save();

      return successResponse(res, 200, {
        message:
          "Seller request accepted successfully and added to the product",
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.deleteSellerRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Seller request id is not valid !!");
    }

    const seller = await Seller.findOne({ user: user._id });

    if (!seller) {
      return errorResponse(res, 404, "Seller not found !!");
    }

    const sellerRequest = await SellerRequest.findById(id);

    if (!sellerRequest) {
      return errorResponse(res, 404, "Seller request not found !!");
    }

    if (sellerRequest.seller.toString() !== seller._id.toString()) {
      return errorResponse(
        res,
        403,
        "You have not access to this seller request !!"
      );
    }

    if (sellerRequest.status !== "pending") {
      return errorResponse(
        res,
        400,
        "Seller request already reject or accept, cannot be deleted !!"
      );
    }

    await SellerRequest.findByIdAndDelete(id);

    return successResponse(res, 200, {
      message: "Seller request deleted successfully :))",
    });
  } catch (err) {
    next(err);
  }
};
