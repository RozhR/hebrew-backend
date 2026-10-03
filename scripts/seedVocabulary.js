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

async function readJson(path) {
    const file = await readFile(new URL(path, import.meta.url), "utf8");

    return JSON.parse(file);
}

async function seedVocabulary() {
    const client = await pool.connect();

    try {
        const verbs = await readJson("../database/seed-data/verbs/base.json");

        const adjectives = await readJson("../database/seed-data/adjectives/base.json");

        const adverbs = await readJson("../database/seed-data/adverbs/base.json");

        await client.query("BEGIN");

        for (const verb of verbs) {
            await client.query(
                `
                    INSERT INTO content.verbs (
                        id,
                        hebrew,
                        translation,
                        level
                    )
                    VALUES ($1, $2, $3, $4)

                        ON CONFLICT (id)
                    DO UPDATE SET
                        hebrew = EXCLUDED.hebrew,
                                                   translation = EXCLUDED.translation,
                                                   level = EXCLUDED.level
                `,
                [verb.id, verb.infinitive, verb.translation, verb.level],
            );
        }

        for (const adjective of adjectives) {
            await client.query(
                `
                    INSERT INTO content.adjectives (
                        id,
                        hebrew,
                        translation,
                        level
                    )
                    VALUES ($1, $2, $3, $4)

                        ON CONFLICT (id)
                    DO UPDATE SET
                        hebrew = EXCLUDED.hebrew,
                                                   translation = EXCLUDED.translation,
                                                   level = EXCLUDED.level
                `,
                [
                    adjective.id,
                    adjective.masculine_singular,
                    adjective.translation,
                    adjective.level,
                ],
            );
        }

        for (const adverb of adverbs) {
            await client.query(
                `
                    INSERT INTO content.adverbs (
                        id,
                        hebrew,
                        translation,
                        level
                    )
                    VALUES ($1, $2, $3, $4)

                        ON CONFLICT (id)
                    DO UPDATE SET
                        hebrew = EXCLUDED.hebrew,
                                                   translation = EXCLUDED.translation,
                                                   level = EXCLUDED.level
                `,
                [adverb.id, adverb.adverb, adverb.translation, adverb.level],
            );
        }

        await client.query("COMMIT");

        console.log(`Verbs synchronized: ${verbs.length}`);
        console.log(`Adjectives synchronized: ${adjectives.length}`);
        console.log(`Adverbs synchronized: ${adverbs.length}`);
        console.log(`Total synchronized: ${verbs.length + adjectives.length + adverbs.length}`);
    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Vocabulary seed error:", error);

        process.exitCode = 1;
    } finally {
        client.release();

        await pool.end();
    }
}

seedVocabulary();
