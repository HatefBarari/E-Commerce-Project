const express = require("express");
const { auth } = require("./../../middlewares/auth");
const {
  getCart,
  addToCart,
  removeFromCart,
} = require("../../controllers/v1/cart.js");

const router = express.Router();

router.route("/").get(auth, getCart);
router.route("/add").post(auth, addToCart);
router.route("/remove").delete(auth, removeFromCart);

module.exports = router;
