import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../database_client.js";

const authRouter = Router();

authRouter.post("/signup", async (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ error: "Username, email, and password are required" });
  }

  if (!email.includes("@")) {
    return res.status(400).json({ error: "Email must be valid" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  try {
    const existingEmail = await db("users").where({ email }).first();

    if (existingEmail) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const existingUsername = await db("users").where({ username }).first();

    if (existingUsername) {
      return res.status(400).json({ error: "Username already in use" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await db("users")
      .insert({ username, email, password_hash })
      .returning(["id", "username", "email", "created_at"]);

    let user;

    if (Array.isArray(newUser)) {
      user = newUser[0];
    } else {
      user = newUser;
    }

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await db("users").where({ email }).first();

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
  } catch (error) {
    next(error);
  }
});

export { authRouter };
