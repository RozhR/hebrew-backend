import express from "express";

import {
    getAdjectiveById,
    getAdjectives,
    getAdverbById,
    getAdverbs,
    getVerbById,
    getVerbs,
} from "../controllers/vocabularyController.js";

const router = express.Router();

router.get("/verbs", getVerbs);
router.get("/verbs/:id", getVerbById);

router.get("/adjectives", getAdjectives);
router.get("/adjectives/:id", getAdjectiveById);

router.get("/adverbs", getAdverbs);
router.get("/adverbs/:id", getAdverbById);

export default router;
