import express from "express";

import wordsRouter from "./routes/wordsRoutes.js";

const app = express();

const PORT = 3000;

app.use(express.json());

app.get("/api/health", (request, response) => {
    response.status(200).json({
        status: "ok",
        message: "Hebrew Learning API is running",
    });
});

app.use("/api/words", wordsRouter);

app.use((request, response) => {
    response.status(404).json({
        message: "Route not found",
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
