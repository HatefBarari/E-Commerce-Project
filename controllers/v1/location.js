const { successResponse } = require("../../helpers/responses");
const cities = require("./../../cities/cities.json");
const provinces = require("./../../cities/provinces.json");

exports.getAllCities = async (req, res, next) => {
  try {
    return successResponse(res, 200, {
      cities,
      provinces,
    });
  } catch (err) {
    next(err);
  }
};
