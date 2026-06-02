const express = require("express");
const router = express.Router();
const { auth } = require("./../../middlewares/auth");
const roleGuard = require("./../../middlewares/roleGuard");
const {
  getAllSellerRequests,
  createSellerRequest,
  updateSellerRequest,
  deleteSellerRequest,
} = require("./../../controllers/v1/sellerRequest");

router
  .route("/")
  .get(auth, roleGuard("SELLER"), getAllSellerRequests)
  .post(auth, roleGuard("SELLER"), createSellerRequest);

router
  .route("/:id")
  .patch(auth, roleGuard("ADMIN"), updateSellerRequest)
  .delete(auth, roleGuard("SELLER"), deleteSellerRequest);

module.exports = router;
