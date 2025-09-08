const { errorResponse } = require("../helpers/responses");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return errorResponse(res, 401, "Token not provided !!");
    }

    const tokenArray = token.split(" ");
    const tokenValue = tokenArray[1];

    if (tokenArray[0] !== "Bearer") {
      return errorResponse(
        res,
        401,
        "Write [Bearer ] at the start ot the token"
      );
    }

    const decoded = jwt.decode(tokenValue, process.env.JWT_SECRET);

    if (!decoded) {
      return errorResponse(res, 401, "Token is not valid !!");
    }

    const userId = decoded.userId;

    const user = await User.findOne({ _id: userId });

    if (!user) {
      return errorResponse(res, 404, "User not found !!");
    }

    req.user = user;

    next();
  } catch (err) {
    next(err);
  }
};
