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
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error, or email/username already in use
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
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
