import { Router } from "express";
import {
  createShortUrl,
  getUrls,
  getUrlById,
  deleteUrl,
} from "../controllers/urlController.js";
import {
  getUrlAnalytics,
  exportUrlAnalyticsCsv,
} from "../controllers/analyticsController.js";
import { createLimiter } from "../middleware/rateLimiters.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", createLimiter, optionalAuth, createShortUrl);
router.get("/", requireAuth, getUrls);
router.get("/:id", requireAuth, getUrlById);
router.delete("/:id", requireAuth, deleteUrl);
router.get("/:id/analytics", requireAuth, getUrlAnalytics);
router.get("/:id/analytics/export.csv", requireAuth, exportUrlAnalyticsCsv);

export default router;
