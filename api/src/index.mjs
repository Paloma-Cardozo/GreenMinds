import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import knex from "./database_client.js";
import plantsRouter from "./routers/plants.js";
import nestedRouter from "./routers/nested.js";
import { authRouter } from "./routers/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";

if (!process.env.JWT_SECRET) {
  console.error("Missing required environment variable: JWT_SECRET");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const apiRouter = express.Router();

// This is an example of how to set up a route. Replace it with your own.
apiRouter.get("/", async (req, res) => {
  // Here is an example of making a query to the database you set up:
  const query = "SELECT 'Hello, world!' AS message;";
  const result = await knex.raw(query);
  res.json(result);
});

// Here is an example of optionally setting up nested routes. Replace it or delete as needed.
apiRouter.use("/nested", nestedRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/plants", plantsRouter);

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(process.env.PORT || 3001, () => {
  const port = process.env.PORT || 3001;
  console.log(`API listening on port ${port}`);
});
