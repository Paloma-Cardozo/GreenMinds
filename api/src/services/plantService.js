import connection from "../database_client.js";

export async function getPlantBookToken(apiUrl, clientId, clientSecret) {
  if (!apiUrl || !clientId || !clientSecret) {
    const error = new Error("apiurl, clientid and clientSecret are required");
    error.status = 400;
    throw error;
  }
  const response = await fetch(`${apiUrl}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!response.ok) {
    const error = new Error(`Token request failed:${response.statusText}`);
    error.status = response.status;
    throw error;
  }
  const data = await response.json();
  return data.access_token;
}

export async function fetchPlantDetails(apiUrl, pid, token) {
  const response = await fetch(`${apiUrl}/plant/detail/${pid}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = new Error(`Plant details not found for pid:${pid}`);
    error.status = response.status;
    throw error;
  }

  return await response.json();
}

export async function findOrCreatePlant(pid, plantData, alias) {
  if (!pid || !plantData) {
    const error = new Error("pid and plantData are required");
    error.status = 400;
    throw error;
  }
  const existing = await connection("favorite_plants").where({ pid }).first();
  if (existing) return existing.id;

  const inserted = await connection("favorite_plants")
    .insert({
      pid,
      alias:
        alias ||
        plantData.common_name ||
        plantData.scientific_name ||
        "Unknown plant",
      img_url: plantData.image_url || null,
    })
    .returning("id");

  const first = Array.isArray(inserted) ? inserted[0] : inserted;
  return typeof first === "object" ? first.id || first : first;
}

export async function isFavoriteExisting(userId, plantId) {
  if (!userId || !plantId) {
    const error = new Error("userId and plantId are required");
    error.status = 400;
    throw error;
  }
  return await connection("users_favorite_plants")
    .where({ user_id: userId, plant_id: plantId })
    .first();
}

export async function addFavorite(userId, plantId) {
  if (!userId || !plantId) {
    const error = new Error("userId and plantId are required");
    error.status = 400;
    throw error;
  }
  const result = await connection("users_favorite_plants")
    .insert({ user_id: userId, plant_id: plantId })
    .returning("*");

  return Array.isArray(result) ? result[0] : result;
}
