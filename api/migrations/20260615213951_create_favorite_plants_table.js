
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.createTable("favorite_plants", (table) => {
    table.increments("id").primary();
    table.string("pid", 100).notNullable().unique();
    table.string("alias", 150);
    table.text("img_url");
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.schema.dropTable("favorite_plants");
};
