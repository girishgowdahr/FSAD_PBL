import { Router } from "express";
import {
  createShortUrl,
  getUrls,
  getUrlById,
  deleteUrl,
} from "../controllers/urlController.js";
import { getUrlAnalytics } from "../controllers/analyticsController.js";
import { createLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.post("/", createLimiter, createShortUrl);
router.get("/", getUrls);
router.get("/:id", getUrlById);
router.delete("/:id", deleteUrl);
router.get("/:id/analytics", getUrlAnalytics);

export default router;
