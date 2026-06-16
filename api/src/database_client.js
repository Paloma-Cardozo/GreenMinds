import knex from "knex";

const isSQLite = process.env.DB_CLIENT === "sqlite3";

const connection = knex({
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
});

export default connection;
