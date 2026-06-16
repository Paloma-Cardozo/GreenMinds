const PLANTBOOK_BASE_URL = "https://open.plantbook.io/api/v1";

async function getAccessToken() {
  const response = await fetch(`${PLANTBOOK_BASE_URL}/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.PLANTBOOK_CLIENT_ID,
      client_secret: process.env.PLANTBOOK_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get Plantbook token: ${response.status}`);
  }

  const { access_token } = await response.json();
  return access_token;
}

async function searchAndFetchPlant(alias, token) {
  const searchRes = await fetch(
    `${PLANTBOOK_BASE_URL}/plant/search?${new URLSearchParams({ alias, limit: 1 })}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!searchRes.ok) {
    throw new Error(`Failed to search for "${alias}": ${searchRes.status}`);
  }

  const { results } = await searchRes.json();
  if (!results?.length) {
    throw new Error(`No plant found for alias "${alias}"`);
  }

  const { pid } = results[0];

  const detailRes = await fetch(
    `${PLANTBOOK_BASE_URL}/plant/detail/${encodeURIComponent(pid)}/`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!detailRes.ok) {
    throw new Error(
      `Failed to fetch details for pid "${pid}": ${detailRes.status}`,
    );
  }

  const { alias: resolvedAlias, image_url } = await detailRes.json();
  return { pid, alias: resolvedAlias ?? null, img_url: image_url ?? null };
}

/**
 * Seed data sourced from Open Plantbook API (https://open.plantbook.io/)
 * Fields: id, pid, alias, img_url, created_at
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
  const aliases = [
    "monstera deliciosa",
    "ficus lyrata",
    "spathiphyllum",
    "epipremnum aureum",
    "sansevieria trifasciata",
  ];

  const token = await getAccessToken();
  const rows = await Promise.all(
    aliases.map(async (alias) => ({
      ...(await searchAndFetchPlant(alias, token)),
      created_at: new Date().toISOString(),
    })),
  );

  await knex("favorite_plants").del();
  await knex("favorite_plants").insert(rows);
};
