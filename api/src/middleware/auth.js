import jwt from "jsonwebtoken";

export function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.log("[AUTH] Missing Authorization header");
    return res.status(401).json({ error: "Authorization header required" });
  }

  const parts = authHeader.split(" ");
  const scheme = parts[0];
  const token = parts[1];

  if (scheme !== "Bearer" || !token) {
    console.log("[AUTH] Malformed Authorization header");
    return res
      .status(401)
      .json({ error: "Authorization header must use Bearer format" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`[AUTH] User ${req.user.id} authenticated`);
    next();
  } catch (err) {
    console.log(`[AUTH] Token verification failed: ${err.message}`);

    let message;

    if (err.name === "TokenExpiredError") {
      message = "Token expired";
    } else {
      message = "Invalid token";
    }

    res.status(401).json({ error: message });
  }
}
