import connection from "../database_client.js";

export async function getPlantBookToken(apiUrl, clientId, clientSecret) {
  if (!apiUrl || !clientId || !clientSecret) {
    const error = new Error("apiurl, clientid and clientSecret are required");
    error.status = 400;
    throw error;
  }
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const normalizedApiUrl = apiUrl.replace(/\/+$/, "");
  const tokenUrl = `${normalizedApiUrl}/token/`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!response.ok) {
    const responseBody = await response.text();
    const error = new Error(
      `Token request failed: ${response.status} ${response.statusText}${responseBody ? ` - ${responseBody}` : ""}`,
    );
    error.status = response.status;
    throw error;
  }
  const data = await response.json();
  return data.access_token;
}

export async function fetchPlantDetails(apiUrl, pid, token, query = {}) {
  const normalizedApiUrl = apiUrl.replace(/\/+$/, "");
  const normalizedPid = String(pid).trim();
  const queryString = new URLSearchParams(query).toString();
  const detailUrl = `${normalizedApiUrl}/plant/detail/${encodeURIComponent(normalizedPid)}/${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(detailUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = new Error(`Plant details not found for pid:${normalizedPid}`);
    error.status = response.status;
    throw error;
  }

  return await response.json();
}

function describeLightLevel(min, max) {
  if (min == null || max == null) return null;
  const avg = (min + max) / 2;
  let label;
  if (avg < 1000) label = "Low light";
  else if (avg < 3000) label = "Medium indirect light";
  else if (avg < 6000) label = "Bright indirect light";
  else label = "Full sun / direct light";
  return `${label} (${min}–${max} lux)`;
}

function describeWatering(min, max) {
  if (min == null || max == null) return null;
  let label;
  if (max < 20) label = "Allow to dry out completely between waterings";
  else if (max < 40) label = "Water when top soil is dry";
  else label = "Keep soil consistently moist";
  return `${label} (soil moisture ${min}–${max}%)`;
}

function describeSoil(min, max) {
  if (min == null || max == null) return null;
  let label;
  if (max < 500) label = "Low-nutrient / lean mix";
  else if (max < 1500) label = "Standard well-draining potting mix";
  else label = "Rich, fertile mix";
  return `${label} (EC ${min}–${max} µS/cm)`;
}

export async function fetchPlantCareDetails(apiUrl, pid, token) {
  const plantData = await fetchPlantDetails(apiUrl, pid, token, {
    include: "care",
  });
  const care = plantData?.care || {};
  return {
    sunlight:
      care.sunlight ||
      plantData?.sunlight ||
      describeLightLevel(plantData?.min_light_lux, plantData?.max_light_lux),
    watering:
      care.watering ||
      plantData?.watering ||
      describeWatering(plantData?.min_soil_moist, plantData?.max_soil_moist),
    soil:
      care.soil ||
      plantData?.soil ||
      describeSoil(plantData?.min_soil_ec, plantData?.max_soil_ec),
    fertilization: care.fertilization || plantData?.fertilization || null,
    pruning: care.pruning || plantData?.pruning || null,
  };
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
