/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function (knex) {
  //Remove the old composite primary key
  await knex.schema.alterTable("users_favorite_plants", (table) => {
    table.dropPrimary();
  });
  // Add the new auto-incrementing primary key
  await knex.schema.alterTable("users_favorite_plants", (table) => {
    table.increments("id").primary();
    table.unique(["user_id", "plant_id"]);
  });
};
export const down = async function (knex) {
  // Reverse the changes
  await knex.schema.alterTable("users_favorite_plants", (table) => {
    table.dropUnique(["user_id", "plant_id"]);
    table.dropColumn("id");
  });
  // Restore the original composite PK
  await knex.schema.alterTable("users_favorite_plants", (table) => {
    table.primary(["user_id", "plant_id"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
