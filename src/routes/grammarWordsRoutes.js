import express from "express";

import {
    addGrammarWord,
    clearGrammarWords,
    getGrammarWords,
    removeGrammarWord,
} from "../controllers/grammarWordsController.js";

import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", requireAuth, getGrammarWords);

router.post("/", requireAuth, addGrammarWord);

router.delete("/", requireAuth, clearGrammarWords);

router.delete("/:category/:id", requireAuth, removeGrammarWord);

export default router;
