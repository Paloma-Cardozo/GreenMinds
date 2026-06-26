import swaggerJSDoc from "swagger-jsdoc";

const servers = [
  {
    url: "http://localhost:3001/api",
    description: "Local development server",
  },
];

if (process.env.API_URL) {
  const productionServer = {
    url: process.env.API_URL,
    description: "Production server",
  };

  servers.push(productionServer);
}

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "GreenMinds API",
      version: "1.0.0",
      description:
        "API for tracking and managing favorite plants, built as a HackYourFuture final project.",
    },
    servers: servers,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routers/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
