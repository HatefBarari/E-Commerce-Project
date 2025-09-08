const express = require("express");
const { getAllCities } = require("../../controllers/v1/location.js");

const router = express.Router();

router.route("/").get(getAllCities);

module.exports = router;
