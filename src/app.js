import express from "express";

import authRouter from "./routes/authRoutes.js";
import grammarRouter from "./routes/grammarRoutes.js";
import userRouter from "./routes/userRoutes.js";
import vocabularyRouter from "./routes/vocabularyRoutes.js";

const app = express();

app.use(express.json());

app.get("/api/health", (request, response) => {
    response.status(200).json({
        status: "ok",
        message: "Hebrew Learning API is running",
    });
});

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);

app.use("/api", vocabularyRouter);
app.use("/api/grammar", grammarRouter);

app.use((request, response) => {
    response.status(404).json({
        message: "Route not found",
    });
});

export default app;
