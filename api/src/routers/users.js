import { Router } from "express";
import { auth } from "../middleware/auth.js";
import db from "../database_client.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
const usersRouter = Router();

// GET /api/users/me
/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current logged-in user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 created_at:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
usersRouter.get(
  "/me",
  auth,
  asyncHandler(async (req, res) => {
    const user = await db("users")
      .where({ id: req.user.id })
      .select("id", "username", "email", "created_at")
      .first();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  }),
);
/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: Update current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated user
 *       401:
 *         description: Unauthorized
 */
usersRouter.put(
  "/me",
  auth,
  asyncHandler(async (req, res) => {
    const { username, email } = req.body;

    const updated = await db("users")
      .where({ id: req.user.id })
      .update({ username, email })
      .returning(["id", "username", "email"]);

    res.json(Array.isArray(updated) ? updated[0] : updated);
  }),
);
/**
 * @swagger
 * /users/me:
 *   delete:
 *     summary: Delete current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted
 *       401:
 *         description: Unauthorized
 */
usersRouter.delete(
  "/me",
  auth,
  asyncHandler(async (req, res) => {
    await db("users").where({ id: req.user.id }).del();

    res.json({ message: "User deleted successfully" });
  }),
);
export default usersRouter;
