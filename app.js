const path = require("path");
const express = require("express");
const authRouter = require("./routes/v1/auth");
const usersRouter = require("./routes/v1/user.js");
const sellersRouter = require("./routes/v1/seller.js");
const locationsRouter = require("./routes/v1/location.js");
const categoriesRouter = require("./routes/v1/category.js");
const productsRouter = require("./routes/v1/product.js");
const notesRouter = require("./routes/v1/note.js");
const sellerRequestsRouter = require("./routes/v1/sellerRequest.js");
const commentsRouter = require("./routes/v1/comment.js");
const cartsRouter = require("./routes/v1/cart.js");
const ordersRouter = require("./routes/v1/order.js");
const checkoutsRouter = require("./routes/v1/checkout.js");
const { setHeaders } = require("./middlewares/headers");
const { redirectToProduct } = require("./controllers/v1/shortLink.js");
const { errorHandler } = require("./middlewares/errorHandler.js");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./utils/swagger.js");

const app = express();

app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(express.json({ limit: "30mb" }));

app.use(setHeaders);

app.use(express.static(path.join(__dirname, "public")));

//* Routers
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/locations", locationsRouter);
app.use("/api/v1/categories", categoriesRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/sellers", sellersRouter);
app.use("/api/v1/products", productsRouter);
app.use("/api/v1/notes", notesRouter);
app.use("/api/v1/comments", commentsRouter);
app.use("/api/v1/cart", cartsRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/api/v1/checkout", checkoutsRouter);
app.use("/api/v1/seller-requests", sellerRequestsRouter);
app.get("/p/:shortIdentifier", redirectToProduct);
app.use("/apis", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((req, res) => {
  console.log("This path is not found: ", req.path);

  return res.status(404).json({
    message: "404! Path Not Found. Please double check tha path / method",
  });
});

app.use(errorHandler);

module.exports = app;
