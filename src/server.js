import app from "./app.js";
import pool from "./db.js";

const PORT = Number(process.env.PORT) || 3000;

const DB_RETRY_DELAY_MS = 2000;
const DB_MAX_RETRIES = 5;

function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function connectToDatabase() {
    for (let attempt = 1; attempt <= DB_MAX_RETRIES; attempt += 1) {
        try {
            const result = await pool.query("SELECT NOW()");

            console.log("PostgreSQL connected:", result.rows[0].now);

            return;
        } catch (error) {
            console.error(
                `PostgreSQL connection attempt ${attempt}/${DB_MAX_RETRIES} failed:`,
                error.message,
            );

            if (attempt === DB_MAX_RETRIES) {
                throw error;
            }

            console.log(`Retrying in ${DB_RETRY_DELAY_MS / 1000} seconds...`);

            await delay(DB_RETRY_DELAY_MS);
        }
    }
}

async function startServer() {
    try {
        await connectToDatabase();

        const server = app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });

        server.on("error", (error) => {
            if (error.code === "EADDRINUSE") {
                console.error(`Port ${PORT} is already in use.`);
            } else {
                console.error("HTTP server error:", error);
            }
        });

        async function shutdown(signal) {
            console.log(`${signal} received. Shutting down...`);

            server.close(async () => {
                try {
                    await pool.end();

                    console.log("PostgreSQL pool closed.");
                    console.log("Server stopped.");
                } catch (error) {
                    console.error("Shutdown error:", error);
                }
            });
        }

        process.on("SIGINT", () => {
            void shutdown("SIGINT");
        });

        process.on("SIGTERM", () => {
            void shutdown("SIGTERM");
        });
    } catch (error) {
        console.error(
            "Unable to start server because PostgreSQL is unavailable:",
            error.message,
        );

        process.exitCode = 1;
    }
}

startServer();