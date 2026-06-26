import bcrypt from "bcrypt";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  await knex("users").del();

  const hiwotHash = await bcrypt.hash("hiwot", 10);
  const julianaHash = await bcrypt.hash("juliana", 10);
  const palomaHash = await bcrypt.hash("paloma", 10);
  const shilpaHash = await bcrypt.hash("shilpa", 10);

  await knex("users").insert([
    {
      username: "Hiwot",
      email: "hiwot@example.com",
      password_hash: hiwotHash,
    },
    {
      username: "Juliana",
      email: "juliana@example.com",
      password_hash: julianaHash,
    },
    {
      username: "Paloma",
      email: "paloma@example.com",
      password_hash: palomaHash,
    },
    {
      username: "Shilpa",
      email: "shilpa@example.com",
      password_hash: shilpaHash,
    },
  ]);
};
