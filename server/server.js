import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { connectDB } from "./config/db.js";
import urlRoutes from "./routes/urlRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { handleRedirect } from "./controllers/urlController.js";
import { redirectLimiter } from "./middleware/rateLimiters.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Security & utility middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// API routes
app.use("/api/urls", urlRoutes);
app.use("/api/analytics", analyticsRoutes);

// Redirect route for short codes
app.get("/:shortCode", redirectLimiter, handleRedirect);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: "Resource not found",
    },
  });
});

// Central error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect DB first, then start server
await connectDB();

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
});

export default app;
