import "dotenv/config";

import { readFile } from "node:fs/promises";

import { createPool } from "./utils/createPool.js";

const pool = createPool();

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
