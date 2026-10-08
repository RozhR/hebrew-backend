import express from "express";

import authRouter from "./routes/authRoutes.js";
import grammarRouter from "./routes/grammarRoutes.js";
import userRouter from "./routes/userRoutes.js";
import vocabularyRouter from "./routes/vocabularyRoutes.js";
import progressRouter from "./routes/progressRoutes.js";
import statisticsRouter from "./routes/statisticsRoutes.js";
import grammarWordsRouter from "./routes/grammarWordsRoutes.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (request, response) => {
    response.status(200).json({
        status: "ok",
        message: "Hebrew Learning API is running",
    });
});

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/progress", progressRouter);
app.use("/api/statistics", statisticsRouter);
app.use("/api/grammar-words", grammarWordsRouter);

app.use("/api", vocabularyRouter);
app.use("/api/grammar", grammarRouter);

app.use((request, response) => {
    response.status(404).json({
        message: "Route not found",
    });
});

app.use((error, request, response, next) => {
    if (response.headersSent) {
        return next(error);
    }

    if (error.type === "entity.parse.failed") {
        return response.status(400).json({ message: "Invalid JSON body" });
    }

    if (error.type === "entity.too.large") {
        return response.status(413).json({ message: "Request body is too large" });
    }

    console.error("Unhandled API error:", error);
    return response.status(500).json({ message: "Internal server error" });
});

export default app;
