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
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            username: {
              type: "string",
              example: "testuser1",
            },
            email: {
              type: "string",
              example: "test1@test.com",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              example: "Something went wrong",
            },
          },
        },
      },
    },
  },
  apis: ["./src/routers/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
