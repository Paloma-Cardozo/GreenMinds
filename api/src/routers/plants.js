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

function extractCareDetails(plantData) {
  const care = plantData?.care ?? {};

  return {
    watering: care.watering ?? plantData?.watering ?? null,
    sunlight: care.sunlight ?? plantData?.sunlight ?? plantData?.light ?? null,
  };
}

router.get("/options", async (_req, res, next) => {
  try {
    const plants = await connection("favorite_plants")
      .select("id", "pid", "alias", "img_url")
      .orderByRaw("LOWER(COALESCE(alias, pid)) ASC");

    res.json(plants);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * tags:
 *   name: Favorites
 *   description: Manage user favorite plants
 */

/**
 * @swagger
 * /favorites:
 *   get:
 *     summary: Get all favorite plants for the authenticated user
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite plants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   favorite_id:
 *                     type: integer
 *                   pid:
 *                     type: string
 *                   alias:
 *                     type: string
 *                   img_url:
 *                     type: string
 *                     nullable: true
 *                   saved_at:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 */

router.get("/favorites", auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const favorites = await connection("users_favorite_plants as ufp")
      .join("favorite_plants as fp", "fp.id", "ufp.plant_id")
      .select(
        "ufp.plant_id as favorite_id",
        "fp.pid",
        "fp.alias",
        "fp.img_url",
        "ufp.saved_at",
      )
      .where("ufp.user_id", userId)
      .orderBy("ufp.saved_at", "DESC");

    if (favorites.length === 0) {
      return res.json(favorites);
    }

    let token = null;

    try {
      token = await getPlantBookToken(
        PLANTBOOK_API_URL,
        process.env.PLANTBOOK_CLIENT_ID,
        process.env.PLANTBOOK_CLIENT_SECRET,
      );
    } catch {
      token = null;
    }

    const enrichedFavorites = await Promise.all(
      favorites.map(async (favorite) => {
        if (!token) {
          return {
            ...favorite,
            watering: null,
            sunlight: null,
          };
        }

        try {
          const plantData = await fetchPlantDetails(
            PLANTBOOK_API_URL,
            favorite.pid,
            token,
            {
              include: "care",
              lang: "en",
            },
          );

          return {
            ...favorite,
            ...extractCareDetails(plantData),
          };
        } catch {
          return {
            ...favorite,
            watering: null,
            sunlight: null,
          };
        }
      }),
    );

    res.json(enrichedFavorites);
  } catch (error) {
    next(error);
  }
});
/**
 * @swagger
 * /favorites:
 *   post:
 *     summary: Add a plant to the user's favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pid
 *             properties:
 *               pid:
 *                 type: string
 *                 description: PlantBook plant ID
 *               alias:
 *                 type: string
 *                 description: Optional custom name for the plant
 *     responses:
 *       201:
 *         description: Plant added to favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 favorite:
 *                   type: object
 *       400:
 *         description: Missing pid or plant already favorited
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Plant not found in PlantBook API
 */

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

/**
 * @swagger
 * /favorites/{id}:
 *   delete:
 *     summary: Remove a plant from the user's favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Favorite record ID
 *     responses:
 *       200:
 *         description: Favorite deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Favorite not found
 *       401:
 *         description: Unauthorized
 */

//Delete favorite
router.delete("/favorites/:id", auth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const favoriteId = req.params.id;
    const fav = await connection("users_favorite_plants")
      .where({ plant_id: favoriteId, user_id: userId })
      .first();
    if (!fav) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    await connection("users_favorite_plants")
      .where({ plant_id: favoriteId, user_id: userId })
      .del();
    res.json({ message: "Favorite deleted successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;
