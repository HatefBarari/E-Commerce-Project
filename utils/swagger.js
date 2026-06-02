const swaggerJsDoc = require("swagger-jsdoc");

const swaggerDefinition = {
  info: {
    title: "Code1Sprint Shop REST API Documentation",
    version: "1.0.0",
    description: "Node.js Shop Rest Apis Document",
  },

  host: "localhost:3000",
  basePath: "/api",
};

module.exports = swaggerJsDoc({
  swaggerDefinition,
  apis: ["./docs/**/*.yaml"],
});
