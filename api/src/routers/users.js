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
    if (!req.user || !req.user.id) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    const user = await db("users")
      .where({ id: req.user.id })
      .select("id", "username", "email", "created_at")
      .first();

    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
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

    // REQUIRED CHECK
    if (!username && !email) {
      return res
        .status(400)
        .json({ error: "At least username or email is required" });
    }

    //  TYPE CHECK
    if (
      (username && typeof username !== "string") ||
      (email && typeof email !== "string")
    ) {
      return res.status(400).json({ error: "Username and email must be text" });
    }

    // EMAIL FORMAT CHECK
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email && !emailPattern.test(email.toLowerCase())) {
      return res.status(400).json({ error: "Email must be valid" });
    }

    // CHECK IF EMAIL EXISTS
    if (email) {
      const existingEmail = await db("users")
        .where({ email: email.toLowerCase() })
        .andWhereNot({ id: req.user.id })
        .first();

      if (existingEmail) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }

    //  CHECK IF USERNAME EXISTS
    if (username) {
      const existingUsername = await db("users")
        .where({ username })
        .andWhereNot({ id: req.user.id })
        .first();

      if (existingUsername) {
        return res.status(400).json({ error: "Username already in use" });
      }
    }

    // UPDATE DATA
    const updated = await db("users")
      .where({ id: req.user.id })
      .update({
        ...(username && { username }),
        ...(email && { email: email.toLowerCase() }),
      })
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
    const deleted = await db("users").where({ id: req.user.id }).del();

    //  CHECK IF USER EXISTED
    if (!deleted) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }

    res.json({ message: "User deleted successfully" });
  }),
);
export default usersRouter;
