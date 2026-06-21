import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "GreenMinds API",
      version: "1.0.0",
      description:
        "API for tracking and managing favorite plants, built as a HackYourFuture final project.",
    },
    servers: [
      {
        url: "http://localhost:3001/api",
        description: "Local development server",
      },
    ],
  },
  apis: ["./src/routers/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
