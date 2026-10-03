import express from "express";

import {
    addStatistic,
    clearStatistics,
    getStatistics,
} from "../controllers/statisticsController.js";

import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", requireAuth, getStatistics);

router.post("/", requireAuth, addStatistic);

router.delete("/", requireAuth, clearStatistics);

export default router;
