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
        const verbs = await readJson("../../hebrew-redux-toolkit/src/data/grammar/verbs/base.json");

        const adjectives = await readJson(
            "../../hebrew-redux-toolkit/src/data/grammar/adjectives/base.json",
        );

        const adverbs = await readJson(
            "../../hebrew-redux-toolkit/src/data/grammar/adverbs/base.json",
        );

        await client.query("BEGIN");

        await client.query("DELETE FROM content.verbs");
        await client.query("DELETE FROM content.adjectives");
        await client.query("DELETE FROM content.adverbs");

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
                `,
                [adverb.id, adverb.adverb, adverb.translation, adverb.level],
            );
        }

        await client.query("COMMIT");

        console.log(`Verbs imported: ${verbs.length}`);
        console.log(`Adjectives imported: ${adjectives.length}`);
        console.log(`Adverbs imported: ${adverbs.length}`);
        console.log(`Total imported: ${verbs.length + adjectives.length + adverbs.length}`);
    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Seed error:", error);

        process.exitCode = 1;
    } finally {
        client.release();

        await pool.end();
    }
}

seedVocabulary();
