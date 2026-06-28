import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../database_client.js";
import { loginLimiter } from "../middleware/loginLimiter.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const authRouter = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: testuser1
 *               email:
 *                 type: string
 *                 example: test1@test.com
 *               password:
 *                 type: string
 *                 example: "12345678"
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error, or email/username already in use
 */

authRouter.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Username, email, and password are required" });
    }

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res
        .status(400)
        .json({ error: "Username, email, and password must be text" });
    }

    const normalizedEmail = email.toLowerCase();

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({ error: "Email must be valid" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const existingEmail = await db("users")
      .where({ email: normalizedEmail })
      .first();

    if (existingEmail) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const existingUsername = await db("users").where({ username }).first();

    if (existingUsername) {
      return res.status(400).json({ error: "Username already in use" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await db("users")
      .insert({ username, email: normalizedEmail, password_hash })
      .returning(["id", "username", "email", "created_at"]);

    let user;

    if (Array.isArray(newUser)) {
      user = newUser[0];
    } else {
      user = newUser;
    }

    res.status(201).json(user);
  }),
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in an existing user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: test1@test.com
 *               password:
 *                 type: string
 *                 example: "12345678"
 *     responses:
 *       200:
 *         description: Login successful, returns a JWT token and basic user info
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Email or password incorrect
 *       429:
 *         description: Too many login attempts, try again after the rate limit window
 */

authRouter.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Email and password must be text" });
    }

    const normalizedEmail = email.toLowerCase();

    const user = await db("users").where({ email: normalizedEmail }).first();

    if (!user) {
      return res.status(401).json({ error: "Email or password incorrect" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Email or password incorrect" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  }),
);

export { authRouter };
