import { Router } from "express";
import bcrypt from "bcrypt";
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
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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

/**
 * @swagger
 * /users/me/password:
 *   put:
 *     summary: Change current user's password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 description: Minimum 8 characters, no spaces allowed
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password changed successfully
 *       400:
 *         description: Validation error (missing fields, invalid length, contains spaces, or password mismatch)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized or current password incorrect
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
usersRouter.put(
  "/me/password",
  auth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current password and new password are required" });
    }

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string"
    ) {
      return res.status(400).json({ error: "Passwords must be text" });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: "New password must be at least 8 characters" });
    }

    if (newPassword.includes(" ")) {
      return res
        .status(400)
        .json({ error: "New password cannot contain spaces" });
    }

    const user = await db("users")
      .where({ id: req.user.id })
      .select("password_hash")
      .first();

    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }

    const passwordMatch = await bcrypt.compare(
      currentPassword,
      user.password_hash,
    );

    if (!passwordMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    await db("users").where({ id: req.user.id }).update({ password_hash });

    res.json({ message: "Password changed successfully" });
  }),
);

export default usersRouter;
