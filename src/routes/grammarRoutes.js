import express from "express";

import {
    getAdjectiveGrammars,
    getAdverbGrammars,
    getVerbGrammars,
} from "../controllers/grammarController.js";

const router = express.Router();

router.get("/verbs", getVerbGrammars);
router.get("/adjectives", getAdjectiveGrammars);
router.get("/adverbs", getAdverbGrammars);

export default router;
