import express from "express";

import {
    getVerbExamples,
    getVerbFuture,
    getVerbGrammarBase,
    getVerbImperative,
    getVerbPast,
    getVerbPresent,
} from "../controllers/verbGrammarController.js";

import {
    getAdjectiveConstruction,
    getAdjectiveExamples,
    getAdjectiveForms,
} from "../controllers/adjectiveGrammarController.js";

import {
    getAdverbExamples,
    getAdverbRelations,
    getAdverbUsage,
} from "../controllers/adverbGrammarController.js";

const router = express.Router();

router.get("/verbs/base/:id", getVerbGrammarBase);
router.get("/verbs/present/:id", getVerbPresent);
router.get("/verbs/past/:id", getVerbPast);
router.get("/verbs/future/:id", getVerbFuture);
router.get("/verbs/imperative/:id", getVerbImperative);
router.get("/verbs/examples/:id", getVerbExamples);

router.get("/adjectives/forms/:id", getAdjectiveForms);
router.get("/adjectives/constructions/:id", getAdjectiveConstruction);
router.get("/adjectives/examples/:id", getAdjectiveExamples);

router.get("/adverbs/usage/:id", getAdverbUsage);
router.get("/adverbs/relations/:id", getAdverbRelations);
router.get("/adverbs/examples/:id", getAdverbExamples);

export default router;
