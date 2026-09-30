import express from "express";

import {
    createWord,
    deleteWord,
    getWordById,
    getWords,
    updateWord,
} from "../controllers/wordsController.js";

const router = express.Router();

router.get("/", getWords);

router.post("/", createWord);

router.get("/:id", getWordById);

router.put("/:id", updateWord);

router.delete("/:id", deleteWord);

router.all("/", (request, response) => {
    response.status(405).json({
        message: "Method not allowed",
    });
});

router.all("/:id", (request, response) => {
    response.status(405).json({
        message: "Method not allowed",
    });
});

export default router;
