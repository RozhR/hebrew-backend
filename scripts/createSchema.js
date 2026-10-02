import "dotenv/config";

import { readFile } from "node:fs/promises";

import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function createSchema() {
    try {
        const schema = await readFile(new URL("../database/schema.sql", import.meta.url), "utf8");

        await pool.query(schema);

        console.log("Database schema created successfully");
    } catch (error) {
        console.error("Database schema error:", error);

        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

createSchema();
