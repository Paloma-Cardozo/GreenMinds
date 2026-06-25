import rateLimit from "express-rate-limit";

const windowMinutes = 15;
const windowMilliseconds = windowMinutes * 60 * 1000;
const maxAttemptsPerWindow = 5;

export const loginLimiter = rateLimit({
  windowMs: windowMilliseconds,
  max: maxAttemptsPerWindow,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many login attempts. Please try again in 15 minutes.",
  },
});
