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

async function seedAdverbGrammar() {
    const client = await pool.connect();

    try {
        const usage = await readJson(
            "../../hebrew-redux-toolkit/src/data/grammar/adverbs/usage.json",
        );

        const relations = await readJson(
            "../../hebrew-redux-toolkit/src/data/grammar/adverbs/relations.json",
        );

        const examples = await readJson(
            "../../hebrew-redux-toolkit/src/data/grammar/adverbs/examples.json",
        );

        await client.query("BEGIN");

        await client.query(`
            TRUNCATE TABLE
                content.adverb_examples,
                content.adverb_relations,
                content.adverb_usage
        `);

        for (const adverb of usage) {
            await client.query(
                `
                    INSERT INTO content.adverb_usage (
                        adverb_id,
                        main_meaning,
                        semantic_category,
                        register,
                        usage
                    )
                    VALUES ($1, $2, $3, $4, $5)
                `,
                [adverb.id, adverb.main_meaning, adverb.category, adverb.register, adverb.usage],
            );
        }

        for (const adverb of relations) {
            await client.query(
                `
                    INSERT INTO content.adverb_relations (
                        adverb_id,
                        synonym,
                        antonym,
                        related_expression,
                        comment
                    )
                    VALUES ($1, $2, $3, $4, $5)
                `,
                [
                    adverb.id,
                    adverb.synonym,
                    adverb.antonym,
                    adverb.related_expression,
                    adverb.comment,
                ],
            );
        }

        for (const adverb of examples) {
            await client.query(
                `
                    INSERT INTO content.adverb_examples (
                        adverb_id,
                        example1,
                        translation1,
                        example2,
                        translation2,
                        example3,
                        translation3
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `,
                [
                    adverb.id,
                    adverb.example1,
                    adverb.translation1,
                    adverb.example2,
                    adverb.translation2,
                    adverb.example3,
                    adverb.translation3,
                ],
            );
        }

        await client.query("COMMIT");

        console.log(`Adverb usage imported: ${usage.length}`);
        console.log(`Adverb relations imported: ${relations.length}`);
        console.log(`Adverb examples imported: ${examples.length}`);
    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Adverb grammar seed error:", error);

        process.exitCode = 1;
    } finally {
        client.release();

        await pool.end();
    }
}

seedAdverbGrammar();
