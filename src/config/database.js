import "dotenv/config";
import pg from "pg";

export function createPool() {
    const pool = new pg.Pool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    pool.on("error", (error) => {
        console.error("Unexpected PostgreSQL pool error:", error.message);
    });
    return pool;
}
