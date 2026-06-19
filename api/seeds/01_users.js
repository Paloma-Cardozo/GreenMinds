/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  await knex("users").del();
  await knex("users").insert([
    {
      username: "Hiwot",
      email: "hiwot@example.com",
      password_hash: "hiwot",
    },
    {
      username: "Juliana",
      email: "juliana@example.com",
      password_hash: "juliana",
    },
    {
      username: "Paloma",
      email: "paloma@example.com",
      password_hash: "paloma",
    },
    {
      username: "Shilpa",
      email: "shilpa@example.com",
      password_hash: "shilpa",
    },
  ]);
};
