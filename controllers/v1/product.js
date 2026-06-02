const { nanoid } = require("nanoid");
const fs = require("fs");
const { errorResponse, successResponse } = require("../../helpers/responses");
const { createPaginationData } = require("../../utils/index");
const Product = require("./../../models/Product");
const { isValidObjectId, default: mongoose } = require("mongoose");
const {
  createProductValidator,
  updateProductValidator,
} = require("./../../validators/product");

const supportedFormat = [
  "image/jpeg",
  "image/png",
  "image/svg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

exports.creare = async (req, res, next) => {
  try {
    let {
      name,
      slug,
      description,
      subCategory,
      sellers,
      filterValues,
      customFilters,
    } = req.body;

    if (sellers) sellers = JSON.parse(sellers);
    filterValues = JSON.parse(filterValues);
    customFilters = JSON.parse(customFilters);

    if (!isValidObjectId(subCategory)) {
      return errorResponse(res, 400, "SubCategory ID is not correct !!");
    }

    const validatedData = await createProductValidator.validate(
      {
        name,
        slug,
        description,
        subCategory,
        sellers,
        filterValues,
        customFilters,
      },
      {
        abortEarly: false,
      }
    );

    let images = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      if (!supportedFormat.includes(file.mimetype)) {
        return errorResponse(res, 400, "UnSupported image format !!");
      }

      images.push(file.filename);
    }

    let shortIdentifier = "";
    while (!shortIdentifier) {
      shortIdentifier = nanoid(6);

      const product = await Product.findOne({
        shortIdentifier,
      });

      if (product) shortIdentifier = "";
    }

    const newProduct = await Product.create({
      name: validatedData.name,
      slug: validatedData.slug,
      description: validatedData.description,
      subCategory: validatedData.subCategory,
      images,
      sellers: validatedData.sellers.map((seller) => ({
        seller: seller.id,
        price: seller.price,
        stock: seller.stock,
      })),
      filterValues: validatedData.filterValues || {},
      customFilters: validatedData.customFilters || {},
      shortIdentifier,
    });

    return successResponse(res, 201, {
      message: "Product created successfully :))",
      product: newProduct,
    });
  } catch (err) {
    next(err);
  }
};

exports.getOneProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Product ID is not correct !!");
    }

    // const product = await Product.findOne({ _id: id });
    const product = await Product.findById(id)
      .populate("subCategory")
      .populate("sellers.seller");

    if (!product) {
      return errorResponse(res, 404, "Product not found !!");
    }

    return successResponse(res, 200, { product });
  } catch (err) {
    next(err);
  }
};

exports.getAllProducts = async (req, res, next) => {
  try {
    const {
      name,
      subCategory,
      minPrice,
      maxPrice,
      sellerId,
      filterValues,
      page = 1,
      limit = 10,
    } = req.query;

    const filters = {
      "sellers.stock": { $gt: 0 },
    };

    if (name) {
      filters.name = { $regex: name, $options: "i" };
    }

    if (subCategory) {
      filters.subCategory =
        mongoose.Types.ObjectId.createFromHexString(subCategory);
    }

    if (minPrice) {
      filters["sellers.price"] = { $gte: +minPrice };
    }

    if (maxPrice) {
      filters["sellers.price"] = { $lte: +maxPrice };
    }

    if (sellerId) {
      filters["sellers.seller"] =
        mongoose.Types.ObjectId.createFromHexString(sellerId);
    }

    if (filterValues) {
      const parsedFilterValues = JSON.parse(filterValues);
      Object.keys(parsedFilterValues).forEach((key) => {
        filters[`filterValues.${key}`] = parsedFilterValues[key];
      });
    } // filters -> { ... }

    const products = await Product.aggregate([
      {
        $match: filters,
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "product",
          as: "comments",
        },
      },
      {
        $addFields: {
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: "$comments" }, 0] },
              then: { $avg: `$comments.rating` },
              else: 0,
            },
          },
        },
      },
      {
        $project: {
          comments: 0,
        },
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: +limit,
      },
    ]);

    const totalProducts = await Product.countDocuments(filters);

    return successResponse(res, 200, {
      products,
      pagination: createPaginationData(
        +page,
        +limit,
        totalProducts,
        "Products"
      ),
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return errorResponse(res, 400, "Product ID is not correct !!");
    }

    const deletedProduct = await Product.findByIdAndDelete(id);

    deletedProduct?.images?.map((image) =>
      fs.unlink(`public/images/products/${image}`, (err) => next(err))
    );

    if (!deletedProduct) {
      return errorResponse(res, 404, "Product not found !!");
    }

    return successResponse(res, 200, {
      message: "Product deleted successfully :))",
      product: deletedProduct,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { name, slug, description, subCategory, filterValues, customFilters } =
      req.body;

    if (filterValues) {
      filterValues = JSON.parse(filterValues);
    }

    if (customFilters) {
      customFilters = JSON.parse(customFilters);
    }

    await updateProductValidator.validate(
      {
        name,
        slug,
        description,
        subCategory,
        customFilters,
        filterValues,
      },
      { abortEarly: false }
    );

    let images = [];
    if (req.files) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        if (!supportedFormat.includes(file.mimetype)) {
          return errorResponse(res, 400, "UnSupported image format !!");
        }

        images.push(file.filename);
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        slug,
        description,
        subCategory,
        customFilters,
        filterValues,
        images: images.length ? images : null,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return errorResponse(res, 404, "Product not found !!");
    }

    return successResponse(res, 200, {
      message: "Product updated successfully :))",
      product: updatedProduct,
    });
  } catch (err) {
    next(err);
  }
};
