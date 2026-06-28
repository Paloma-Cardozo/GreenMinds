
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up =  function (knex) {
  const exists = await knex.schema.hasColumn("users_favorite_plants", "id");

  if (!exists) {
    await knex.schema.alterTable("users_favorite_plants", (table) => {
      table.increments("id").primary();
    });
  }
};

export const down =  function (knex) {
  const exists = await knex.schema.hasColumn("users_favorite_plants", "id");

  if (exists) {
    await knex.schema.alterTable("users_favorite_plants", (table) => {
      table.dropColumn("id");
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
