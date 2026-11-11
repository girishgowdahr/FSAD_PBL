import { Router } from "express";
import { getSummary, exportAllUrlsCsv } from "../controllers/analyticsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/summary", requireAuth, getSummary);
router.get("/export.csv", requireAuth, exportAllUrlsCsv);

export default router;
