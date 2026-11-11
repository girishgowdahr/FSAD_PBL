import rateLimit from "express-rate-limit";

export const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 creates per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: "Too many requests, please try again later.",
    },
  },
});

export const redirectLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 redirects per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: "Too many requests, please try again later.",
    },
  },
});
