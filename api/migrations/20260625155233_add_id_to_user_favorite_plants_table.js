/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable("users_favorite_plants", (table) => {
    table.increments("id").primary(); // add new PK
    table.unique(["user_id", "plant_id"]); // enforce uniqueness
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("users_favorite_plants", (table) => {
    table.dropUnique(["user_id", "plant_id"]);
    table.dropColumn("id");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
