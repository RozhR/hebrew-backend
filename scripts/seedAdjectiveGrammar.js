import { createPool } from "./utils/createPool.js";
import { readJson } from "./utils/readJson.js";

const pool = createPool();

async function seedAdjectiveGrammar() {
    const client = await pool.connect();

    try {
        const base = await readJson("../database/seed-data/adjectives/base.json", import.meta.url);

        const constructions = await readJson(
            "../database/seed-data/adjectives/constructions.json",
            import.meta.url,
        );

        const examples = await readJson(
            "../database/seed-data/adjectives/examples.json",
            import.meta.url,
        );

        await client.query("BEGIN");

        await client.query(`
            TRUNCATE TABLE
                content.adjective_examples,
                content.adjective_constructions,
                content.adjective_forms
        `);

        for (const adjective of base) {
            await client.query(
                `
                    INSERT INTO content.adjective_forms (
                        adjective_id,
                        masculine_singular,
                        feminine_singular,
                        masculine_plural,
                        feminine_plural
                    )
                    VALUES ($1, $2, $3, $4, $5)
                `,
                [
                    adjective.id,
                    adjective.masculine_singular,
                    adjective.feminine_singular,
                    adjective.masculine_plural,
                    adjective.feminine_plural,
                ],
            );
        }

        for (const adjective of constructions) {
            await client.query(
                `
                    INSERT INTO content.adjective_constructions (
                        adjective_id,
                        construction,
                        meaning
                    )
                    VALUES ($1, $2, $3)
                `,
                [adjective.id, adjective.construction, adjective.meaning],
            );
        }

        for (const adjective of examples) {
            await client.query(
                `
                    INSERT INTO content.adjective_examples (
                        adjective_id,
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
                    adjective.id,
                    adjective.example1,
                    adjective.translation1,
                    adjective.example2,
                    adjective.translation2,
                    adjective.example3,
                    adjective.translation3,
                ],
            );
        }

        await client.query("COMMIT");

        console.log(`Adjective forms imported: ${base.length}`);
        console.log(`Adjective constructions imported: ${constructions.length}`);
        console.log(`Adjective examples imported: ${examples.length}`);
    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Adjective grammar seed error:", error);

        process.exitCode = 1;
    } finally {
        client.release();

        await pool.end();
    }
}

seedAdjectiveGrammar();
