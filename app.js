const path = require("path");
const express = require("express");
const authRouter = require("./routes/v1/auth");
const usersRouter = require("./routes/v1/user.js");
const sellersRouter = require("./routes/v1/seller.js");
const locationsRouter = require("./routes/v1/location.js");
const { setHeaders } = require("./middlewares/headers");

const app = express();

app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(express.json({ limit: "30mb" }));

app.use(setHeaders);

app.use(express.static(path.join(__dirname, "public")));

//* Routers
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/locations", locationsRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/sellers", sellersRouter);

app.use((req, res) => {
  console.log("This path is not found: ", req.path);

  return res.status(404).json({
    message: "404! Path Not Found. Please double check tha path / method",
  });
});

// app.use(errorHandler)

module.exports = app;
