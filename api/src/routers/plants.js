import express from "express";
import { auth } from "../middleware/auth.js";
import connection from "../database_client.js";
import {
  getPlantBookToken,
  fetchPlantCareDetails,
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
 *   name: Plants
 *   description: Search and retrieve plant information from PlantBook
 */

/**
 * @swagger
 * /plants/care/{pid}:
 *   get:
 *     summary: Get care details for a specific plant
 *     tags: [Plants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pid
 *         required: true
 *         schema:
 *           type: string
 *         description: PlantBook plant ID
 *     responses:
 *       200:
 *         description: Care details for the plant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sunlight:
 *                   type: string
 *                   nullable: true
 *                   description: Sunlight requirement description
 *                 watering:
 *                   type: string
 *                   nullable: true
 *                   description: Watering requirement description
 *                 soil:
 *                   type: string
 *                   nullable: true
 *                   description: Soil requirement description
 *                 fertilization:
 *                   type: string
 *                   nullable: true
 *                   description: Fertilization requirement description
 *                 pruning:
 *                   type: string
 *                   nullable: true
 *                   description: Pruning requirement description
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/care/:pid",
  auth,
  asyncHandler(async (req, res) => {
    const pid = req.params.pid;
    const token = await getPlantBookToken(
      PLANTBOOK_API_URL,
      process.env.PLANTBOOK_CLIENT_ID,
      process.env.PLANTBOOK_CLIENT_SECRET
    );
    const care = await fetchPlantCareDetails(PLANTBOOK_API_URL, pid, token);
    res.json(care);
  })
);

/**
 * @swagger
 * /plants/options:
 *   get:
 *     summary: Get all plants available as favorites options
 *     tags: [Plants]
 *     responses:
 *       200:
 *         description: List of all plants stored in the database
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   pid:
 *                     type: string
 *                     description: PlantBook plant ID
 *                   alias:
 *                     type: string
 *                     nullable: true
 *                     description: Common or custom name of the plant
 *                   img_url:
 *                     type: string
 *                     nullable: true
 *                     description: URL of the plant image
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/options",
  asyncHandler(async (_req, res) => {
    const plants = await connection("favorite_plants")
      .select("id", "pid", "alias", "img_url")
      .orderByRaw("LOWER(COALESCE(alias, pid)) ASC");

    res.json(plants);
  })
);

/**
 * @swagger
 * /plants/search:
 *   get:
 *     summary: Search for plants in the PlantBook API
 *     tags: [Plants]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 3
 *         description: Search query (minimum 3 characters). Returns empty results if shorter.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Maximum number of results to return (clamped between 1 and 50)
 *     responses:
 *       200:
 *         description: >
 *           Search results from PlantBook. Returns `{ count: 0, results: [] }` when
 *           `q` is fewer than 3 characters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: Total number of results found
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       pid:
 *                         type: string
 *                         description: PlantBook plant ID
 *                       alias:
 *                         type: string
 *                         description: Common name of the plant
 *                       img_url:
 *                         type: string
 *                         nullable: true
 *                         description: URL of the plant image
 *       502:
 *         description: PlantBook API search request failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/search",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || "").trim();
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      50
    );

    if (q.length < 3) {
      return res.json({ count: 0, results: [] });
    }

    const token = await getPlantBookToken(
      PLANTBOOK_API_URL,
      process.env.PLANTBOOK_CLIENT_ID,
      process.env.PLANTBOOK_CLIENT_SECRET
    );

    const searchUrl = `${PLANTBOOK_API_URL}/plant/search?alias=${encodeURIComponent(q)}&limit=${limit}`;
    const response = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = new Error(
        `PlantBook search failed: ${response.status} ${response.statusText}`
      );
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    res.json(data);
  })
);

/**
 * @swagger
 * tags:
 *   name: Favorites
 *   description: Manage user favorite plants
 */

/**
 * @swagger
 * /plants/favorites:
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
 *                   sunlight:
 *                     type: string
 *                     nullable: true
 *                   watering:
 *                     type: string
 *                     nullable: true
 *                   soil:
 *                     type: string
 *                     nullable: true
 *                   fertilization:
 *                     type: string
 *                     nullable: true
 *                   pruning:
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
 *       500:
 *         description: Internal server error
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
        "ufp.plant_id as favorite_id",
        "fp.pid",
        "fp.alias",
        "fp.img_url",
        "ufp.saved_at"
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
        process.env.PLANTBOOK_CLIENT_SECRET
      );
    } catch {
      token = null;
    }

    const enrichedFavorites = await Promise.all(
      favorites.map(async (favorite) => {
        if (!token) {
          return {
            ...favorite,
            sunlight: null,
            watering: null,
            soil: null,
            fertilization: null,
            pruning: null,
          };
        }

        try {
          const care = await fetchPlantCareDetails(
            PLANTBOOK_API_URL,
            favorite.pid,
            token
          );

          return {
            ...favorite,
            ...care,
          };
        } catch {
          return {
            ...favorite,
            sunlight: null,
            watering: null,
            soil: null,
            fertilization: null,
            pruning: null,
          };
        }
      })
    );

    res.json(enrichedFavorites);
  })
);

/**
 * @swagger
 * /plants/favorites:
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
 *                   properties:
 *                     id:
 *                       type: integer
 *                     user_id:
 *                       type: integer
 *                     plant_id:
 *                       type: integer
 *                     saved_at:
 *                       type: string
 *                       format: date-time
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
    const normalizedPid = String(pid).trim();
    const existingPlant = await connection("favorite_plants")
      .select("id")
      .where({ pid: normalizedPid })
      .first();

    let plantId = existingPlant?.id;

    if (!plantId) {
      // Get PlantBook token only when we need to create a new plant record.
      const token = await getPlantBookToken(
        PLANTBOOK_API_URL,
        process.env.PLANTBOOK_CLIENT_ID,
        process.env.PLANTBOOK_CLIENT_SECRET
      );

      const plantData = await fetchPlantDetails(
        PLANTBOOK_API_URL,
        normalizedPid,
        token
      );
      plantId = await findOrCreatePlant(normalizedPid, plantData, alias);
    }

    const existingFav = await isFavoriteExisting(userId, plantId);
    if (existingFav) {
      return res.status(400).json({ error: "plant already in favorites" });
    }
    const favorite = await addFavorite(userId, plantId);
    res.status(201).json({
      message: "plant added to favorites",
      favorite,
    });
  })
);

/**
 * @swagger
 * /plants/favorites/{id}:
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

router.delete(
  "/favorites/:id",
  auth,
  asyncHandler(async (req, res) => {
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
  })
);

export default router;
