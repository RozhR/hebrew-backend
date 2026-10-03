import express from "express";

import { getProgress, updateProgress } from "../controllers/progressController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", requireAuth, getProgress);

router.put("/:category", requireAuth, updateProgress);

export default router;
