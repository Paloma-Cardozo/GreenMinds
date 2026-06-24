import express from "express";
import { auth } from "../middleware/auth.js";
import connection from "../database_client.js";
import {
  getPlantBookToken,
  fetchPlantDetails,
  findOrCreatePlant,
  isFavoriteExisting,
  addFavorite,
} from "../services/plantService.js";
const router = express.Router();

const PLANTBOOK_API_URL = "https://open.plantbook.io/api/v1";

router.get("/favorites", auth, async (req, res, next) => {
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
    next(error);
  }
});

router.post("/favorites", auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { pid, alias } = req.body;

    if (!pid) {
      return res.status(400).json({ error: "pid(plantBook ID) is required" });
    }
    //Get PlantBook token
    const token = await getPlantBookToken(
      PLANTBOOK_API_URL,
      process.env.PLANTBOOK_CLIENT_ID,
      process.env.PLANTBOOK_CLIENT_SECRET,
    );

    const plantData = await fetchPlantDetails(PLANTBOOK_API_URL, pid, token);
    const plantId = await findOrCreatePlant(pid, plantData, alias);
    const existingFav = await isFavoriteExisting(userId, plantId);
    if (existingFav) {
      return res.status(400).json({ error: "plant already in favorites" });
    }
    const favorite = await addFavorite(userId, plantId);
    res.status(201).json({
      message: "plant added to favorites",
      favorite,
    });
  } catch (error) {
    next(error);
  }
});

//Delete favorite
router.delete("/favorites/:id", auth, async (req, res, next) => {
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
    next(error);
  }
});

export default router;
