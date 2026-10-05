import { createPool } from "./utils/createPool.js";
import { readJson } from "./utils/readJson.js";

const pool = createPool();

async function seedVocabulary() {
    const client = await pool.connect();

    try {
        const verbs = await readJson("../database/seed-data/verbs/base.json", import.meta.url);

        const adjectives = await readJson(
            "../database/seed-data/adjectives/base.json",
            import.meta.url,
        );

        const adverbs = await readJson("../database/seed-data/adverbs/base.json", import.meta.url);

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
