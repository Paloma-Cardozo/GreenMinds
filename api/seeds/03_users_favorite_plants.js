/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  await knex("users_favorite_plants").del();

  const users = await knex("users").select("id");
  const plants = await knex("favorite_plants").select("id");

  if (!users.length || !plants.length) {
    throw new Error(
      "No users or favorite_plants found. Run previous seeds first.",
    );
  }

  const rows = [];
  for (const user of users) {
    for (const plant of plants) {
      rows.push({
        user_id: user.id,
        plant_id: plant.id,
        saved_at: new Date().toISOString(),
      });
    }
  }

  await knex("users_favorite_plants").insert(rows);
};
