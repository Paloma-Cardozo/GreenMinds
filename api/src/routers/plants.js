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
import { asyncHandler } from "../middleware/asyncHandler.js";
const router = express.Router();

const PLANTBOOK_API_URL = "https://open.plantbook.io/api/v1";
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.get(
  "/favorites",
  auth,
  asyncHandler(async (req, res) => {
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
  }),
);
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Plant not found in PlantBook API
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.post(
  "/favorites",
  auth,
  asyncHandler(async (req, res) => {
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
  }),
);

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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

//Delete favorite
router.delete(
  "/favorites/:id",
  auth,
  asyncHandler(async (req, res) => {
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
  }),
);

export default router;
