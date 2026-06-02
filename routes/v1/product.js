const express = require("express");
const { auth } = require("./../../middlewares/auth");
const roleGuard = require("./../../middlewares/roleGuard");
const {
  creare,
  deleteProduct,
  getAllProducts,
  getOneProduct,
  updateProduct,
} = require("../../controllers/v1/product");
const { multerStorage } = require("./../../utils/multerConfigs");

const upload = multerStorage("public/images/products");

const router = express.Router();

router
  .route("/")
  .post(auth, roleGuard("ADMIN"), upload.array("images", 10), creare)
  .get(getAllProducts);

router
  .route("/:id")
  .get(getOneProduct)
  .patch(auth, roleGuard("ADMIN"), upload.array("images", 10), updateProduct)
  .delete(auth, roleGuard("ADMIN"), deleteProduct);

module.exports = router;
