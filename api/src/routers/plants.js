import express from "express";
import auth from "/../middleware/auth.js";
import connection from "../database_client.js";
const router = express.Router();

const PLANTBOOK_API_URL = "https://open.plantbook.io/api/v1";
//helper fetch plantBook token
async function getPlantBookToken() {
  const response = await fetch(`${PLANTBOOK_API_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.PLANTBOOK_CLIENT_ID,
      client_secret: process.env.PLANTBOOK_CLIENT_SECRET,
    }),
  });
  const data = await response.json();
  return data.access_token;
}

router.get("/favorites", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const favorites = await connection("users_favorite_plants as ufp")
      .join("favorite_plants as fp", "fp.id", "ufp.plant_id")
      .select(
        "ufp.id as favorite_id",
        "fp.pid",
        "fp.alias",
        "fp.img_url",
        "ufp.saved_at",
      )
      .where("ufp.user_id", userId)
      .orderBy("ufp.saved_at", "DESC");

    res.json(favorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/favorites", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { pid, alias } = req.body;

    if (!pid) {
      return res.status(400).json({ error: "pid(plantBook ID) is required" });
    }
    //Get PlantBook token
    const token = await getPlantBookToken();

    // Fetch plant details
    const response = await fetch(`${PLANTBOOK_API_URL}/plant/detail/${pid}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return res
        .status(404)
        .json({ error: "Plant not found in plantBook API" });
    }

    const plantData = await response.json();
    //check if plant already exists in favorite_plants
    const existingPlant = await connection("favorite_plants")
      .where({ pid })
      .first();

    let plantId;
    if (!existingPlant) {
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
      if (Array.isArray(inserted)) {
        const first = inserted[0];
        plantId = typeof first === "object" ? first.id || first : first;
      } else if (typeof inserted === "object") {
        plantId = inserted.id;
      } else {
        plantId = inserted;
      }
    } else {
      plantId = existingPlant.id;
    }

    //prevent duplicate favorites for same user
    const existingFav = await connection("users_favorite_plants")
      .where({ user_id: userId, plant_id: plantId })
      .first();
    if (existingFav) {
      return res.status(400).json({ error: "plant already in favorites" });
    }
    //Insert into join table users_favorite_plants
    const result = await connection("users_favorite_plants")
      .insert({
        user_id: userId,
        plant_id: plantId,
      })
      .returning("*");
    const favorite = Array.isArray(result) ? result[0] : result;
    res.status(201).json({
      message: "plant added to favorites",
      favorite,
    });
  } catch (error) {
    console.error("Error adding favorite:", error);
    res.status(500).json({ error: "Server error" });
  }
});

//Delete favorite
router.delete("/favorites/:id", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const favoriteId = req.params.id;
    const fav = await connection("users_favorite_plants")
      .where({ id: favoriteId, user_id: userId })
      .first();
    if (!fav) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    await connection("users_favorite_plants").where({ id: favoriteId }).del();
    res.json({ message: "Favorite deleted successfully" });
  } catch (error) {
    console.error("Error deleting favorite:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
