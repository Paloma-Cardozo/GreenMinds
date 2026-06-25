import { Router } from "express";
import { auth } from "../middleware/auth.js";
import db from "../database_client.js";

const usersRouter = Router();

// GET /api/users/me
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
usersRouter.delete("/me", auth, async (req, res, next) => {
  try {
    await db("users").where({ id: req.user.id }).del();

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
});
export default usersRouter;
