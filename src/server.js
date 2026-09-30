import app from "./app.js";
import pool from "./db.js";

const PORT = 3000;

async function startServer() {
    try {
        const result = await pool.query("SELECT NOW()");

        console.log("PostgreSQL connected:", result.rows[0].now);

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("PostgreSQL connection error:", error.message);
        process.exit(1);
    }
}

startServer();
