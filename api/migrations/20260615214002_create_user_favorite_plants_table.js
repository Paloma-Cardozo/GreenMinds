/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.createTable("users_favorite_plants", (table) => {
    table.increments("id").primary(); //single primary key
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("plant_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("favorite_plants")
      .onDelete("CASCADE");
    table.timestamp("saved_at").defaultTo(knex.fn.now());
    // prevent duplicates (user_id + plant_id)
    table.unique(["user_id", "plant_id"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.schema.dropTable("users_favorite_plants");
};
