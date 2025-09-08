const express = require("express");
const {
  banUser,
  createAddress,
  deleteAddress,
  updateAddress,
  getAll,
} = require("../../controllers/v1/user");
const { auth } = require("../../middlewares/auth");
const roleGuard = require("../../middlewares/roleGuard");

const router = express.Router();

router.route("/").get(auth, roleGuard("ADMIN"), getAll);
router.route("/ban/:userId").post(auth, roleGuard("ADMIN"), banUser);
router.route("/me/addresses").post(auth, createAddress);

router
  .route("/me/addresses/:addressId")
  .delete(auth, deleteAddress)
  .patch(auth, updateAddress); // -> Put (Update All Data) -> Patch (Update part of data)

module.exports = router;
