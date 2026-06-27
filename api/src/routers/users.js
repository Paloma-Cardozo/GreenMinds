import { Router } from "express";
import { auth } from "../middleware/auth.js";
import db from "../database_client.js";

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
usersRouter.get("/me", auth, async (req, res, next) => {
  try {
    const user = await db("users")
      .where({ id: req.user.id })
      .select("id", "username", "email", "created_at")
      .first();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});
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
usersRouter.put("/me", auth, async (req, res, next) => {
  const { username, email } = req.body;

  try {
    const updated = await db("users")
      .where({ id: req.user.id })
      .update({ username, email })
      .returning(["id", "username", "email"]);

    res.json(Array.isArray(updated) ? updated[0] : updated);
  } catch (err) {
    next(err);
  }
});
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
usersRouter.delete("/me", auth, async (req, res, next) => {
  try {
    await db("users").where({ id: req.user.id }).del();

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
});
export default usersRouter;
