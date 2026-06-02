const exporess = require("express");
const roleGuard = require("../../middlewares/roleGuard");
const { auth } = require("../../middlewares/auth");
const { getAllOrders, updateOrder } = require("../../controllers/v1/order");

const router = exporess.Router();

router.route("/").get(auth, getAllOrders);
router.route("/:id").patch(auth, roleGuard("ADMIN"), updateOrder);

module.exports = router;
