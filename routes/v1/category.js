const express = require("express");
const { auth } = require("./../../middlewares/auth");
const roleGuard = require("./../../middlewares/roleGuard");
const {
  fetchAllCategories,
  createCategory,
  deleteCategory,
  editCategory,
} = require("./../../controllers/v1/category");
const { multerStorage } = require("./../../utils/multerConfigs");
const {
  createSubCategory,
  getAllSubCategories,
  getSubCategory,
  deleteSubCategory,
  editSubCategory,
} = require("../../controllers/v1/subCategory");

const upload = multerStorage("public/images/category-icons");

const router = express.Router();

router
  .route("/")
  .get(fetchAllCategories)
  .post(auth, roleGuard("ADMIN"), upload.single("icon"), createCategory);

router
  .route("/:categoryId")
  .put(auth, roleGuard("ADMIN"), upload.single("icon"), editCategory)
  .delete(auth, roleGuard("ADMIN"), deleteCategory);

router
  .route("/sub")
  .post(auth, roleGuard("ADMIN"), createSubCategory)
  .get(getAllSubCategories);

router
  .route("/sub/:categoryId")
  .get(getSubCategory)
  .put(auth, roleGuard("ADMIN"), editSubCategory)
  .delete(auth, roleGuard("ADMIN"), deleteSubCategory);

module.exports = router;
