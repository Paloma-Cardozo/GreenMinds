import "dotenv/config";

const isSQLite = process.env.DB_CLIENT === "sqlite3";

/** @type {import('knex').Knex.Config} */
const config = {
  client: process.env.DB_CLIENT,
  connection: isSQLite
    ? { filename: process.env.DB_SQLITE_FILENAME }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE_NAME,
        ssl:
          process.env.DB_USE_SSL === "true"
            ? { rejectUnauthorized: false }
            : false,
      },
  useNullAsDefault: isSQLite,
  migrations: {
    directory: "./migrations",
  },
  seeds: {
    directory: "./seeds", 
  },
};

export default config;
