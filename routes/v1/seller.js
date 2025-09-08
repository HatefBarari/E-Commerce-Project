const express = require("express");
const { auth } = require("../../middlewares/auth");
const roleGuard = require("../../middlewares/roleGuard");
const {
  create,
  update,
  deleteSeller,
  get,
} = require("../../controllers/v1/seller");

const router = express.Router();

router
  .route("/")
  .post(auth, roleGuard("SELLER"), create)
  .patch(auth, roleGuard("SELLER"), update)
  .delete(auth, roleGuard("SELLER"), deleteSeller)
  .get(auth, roleGuard("SELLER"), get);

module.exports = router;
