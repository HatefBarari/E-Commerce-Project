const { errorResponse, successResponse } = require("../../helpers/responses");
const {
  categoryValidator,
  categoryEditValidator,
} = require("./../../validators/category");
const Category = require("./../../models/Category");
const SubCategory = require("./../../models/SubCategory");
const { isValidObjectId } = require("mongoose");

const supportedFormat = [
  "image/jpeg",
  "image/png",
  "image/svg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

exports.fetchAllCategories = async (req, res, next) => {
  try {
    const fetchSubcategoriesRecursively = async (parentId = null) => {
      const subCategories = await SubCategory.find({ parent: parentId });
      const parentSubCategories = await Category.find({
        parent: parentId,
      }).lean();

      const fetchedParentSubCategories = [];

      for (const category of parentSubCategories) {
        category.subCategories = await fetchSubcategoriesRecursively(
          category._id
        );

        fetchedParentSubCategories.push(category);
      }

      return [...fetchedParentSubCategories, ...subCategories];
    };

    const categories = await fetchSubcategoriesRecursively(null);

    return successResponse(res, 200, { categories });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    let { title, slug, parent, description, filters } = req.body;
    filters = JSON.parse(filters);

    await categoryValidator.validate(
      {
        title,
        slug,
        parent,
        description,
        filters,
      },
      { abortEarly: false }
    );

    let icon = null;
    if (req.file) {
      const { filename, mimetype } = req.file;

      if (!supportedFormat.includes(mimetype)) {
        return errorResponse(res, 400, "Unsupported image format !!");
      }

      icon = {
        filename,
        path: `images/category-icons/${filename}`,
      };
    }

    const newCategory = await Category.create({
      title,
      slug,
      parent,
      description,
      icon,
      filters,
    });

    return successResponse(res, 201, {
      category: newCategory,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    if (!isValidObjectId(categoryId)) {
      return errorResponse(res, 400, "Category ID is not valid !!");
    }

    const deletedCategory = await Category.findByIdAndDelete(categoryId);

    if (!deletedCategory) {
      return errorResponse(res, 404, "Category not found !!");
    }

    return successResponse(res, 200, {
      message: "Category deleted successfully :))",
      category: deletedCategory,
    });
  } catch (err) {
    next(err);
  }
};

exports.editCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    let { title, slug, parent, description, filters } = req.body;
    filters = JSON.parse(filters);

    if (!isValidObjectId(categoryId)) {
      return errorResponse(res, 400, "Category ID is not valid !!");
    }

    await categoryEditValidator.validate(
      {
        title,
        slug,
        parent,
        description,
        filters,
      },
      { abortEarly: false }
    );

    let icon = null;
    if (req.file) {
      const { filename, mimetype } = req.file;

      if (!supportedFormat.includes(mimetype)) {
        return errorResponse(res, 400, "Unsupported image format !!");
      }

      icon = {
        filename,
        path: `images/category-icons/${filename}`,
      };
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      {
        title,
        slug,
        parent,
        description,
        filters,
        icon,
      },
      { new: true }
    );

    if (!updatedCategory) {
      return errorResponse(res, 404, "Category not found !!");
    }

    return successResponse(res, 200, { category: updatedCategory });
  } catch (err) {
    next(err);
  }
};
