import express from "express";

import {
    addGrammarStatistic,
    clearGrammarStatistics,
    getGrammarStatistics,
} from "../controllers/grammarStatisticsController.js";

import {
    addStatistic,
    clearStatistics,
    getStatistics,
} from "../controllers/statisticsController.js";

import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================================================
   VOCABULARY TEST STATISTICS
   ========================================================= */

router.get("/", requireAuth, getStatistics);

router.post("/", requireAuth, addStatistic);

router.delete("/", requireAuth, clearStatistics);

/* =========================================================
   GRAMMAR TEST STATISTICS
   ========================================================= */

router.get("/grammar", requireAuth, getGrammarStatistics);

router.post("/grammar", requireAuth, addGrammarStatistic);

router.delete("/grammar", requireAuth, clearGrammarStatistics);

export default router;
