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

async function seedVerbGrammar() {
    const client = await pool.connect();

    try {
        const base = await readJson("../../hebrew-redux-toolkit/src/data/grammar/verbs/base.json");

        const present = await readJson(
            "../../hebrew-redux-toolkit/src/data/grammar/verbs/present.json",
        );

        const past = await readJson("../../hebrew-redux-toolkit/src/data/grammar/verbs/past.json");

        const futureImperative = await readJson(
            "../../hebrew-redux-toolkit/src/data/grammar/verbs/futureImperative.json",
        );

        const examples = await readJson(
            "../../hebrew-redux-toolkit/src/data/grammar/verbs/examples.json",
        );

        const presentById = new Map(present.map((item) => [item.id, item]));

        await client.query("BEGIN");

        await client.query(`
            TRUNCATE TABLE
                verb_examples,
                verb_future_imperative,
                verb_past,
                verb_present,
                verb_grammar
        `);

        for (const verb of base) {
            const presentData = presentById.get(verb.id);

            if (!presentData) {
                throw new Error(`Present data not found for verb id ${verb.id}`);
            }

            await client.query(
                `
                    INSERT INTO verb_grammar (
                        verb_id,
                        government,
                        binyan
                    )
                    VALUES ($1, $2, $3)
                `,
                [verb.id, verb.government, presentData.binyan],
            );
        }

        for (const verb of present) {
            await client.query(
                `
                    INSERT INTO verb_present (
                        verb_id,
                        masculine_singular,
                        feminine_singular,
                        masculine_plural,
                        feminine_plural
                    )
                    VALUES ($1, $2, $3, $4, $5)
                `,
                [
                    verb.id,
                    verb.masculine_singular,
                    verb.feminine_singular,
                    verb.masculine_plural,
                    verb.feminine_plural,
                ],
            );
        }

        for (const verb of past) {
            await client.query(
                `
                    INSERT INTO verb_past (
                        verb_id,
                        first_person_singular,
                        second_person_masculine_singular,
                        second_person_feminine_singular,
                        third_person_masculine_singular,
                        third_person_feminine_singular,
                        first_person_plural,
                        second_person_masculine_plural,
                        second_person_feminine_plural,
                        third_person_plural
                    )
                    VALUES (
                        $1, $2, $3, $4, $5,
                        $6, $7, $8, $9, $10
                    )
                `,
                [
                    verb.id,
                    verb.first_person_singular,
                    verb.second_person_masculine_singular,
                    verb.second_person_feminine_singular,
                    verb.third_person_masculine_singular,
                    verb.third_person_feminine_singular,
                    verb.first_person_plural,
                    verb.second_person_masculine_plural,
                    verb.second_person_feminine_plural,
                    verb.third_person_plural,
                ],
            );
        }

        for (const verb of futureImperative) {
            await client.query(
                `
                    INSERT INTO verb_future_imperative (
                        verb_id,
                        first_person_singular,
                        second_person_masculine_singular,
                        second_person_feminine_singular,
                        third_person_masculine_singular,
                        third_person_feminine_singular,
                        first_person_plural,
                        second_person_masculine_plural,
                        second_person_feminine_plural,
                        third_person_plural,
                        imperative_masculine,
                        imperative_feminine,
                        imperative_plural
                    )
                    VALUES (
                        $1, $2, $3, $4, $5,
                        $6, $7, $8, $9, $10,
                        $11, $12, $13
                    )
                `,
                [
                    verb.id,
                    verb.first_person_singular,
                    verb.second_person_masculine_singular,
                    verb.second_person_feminine_singular,
                    verb.third_person_masculine_singular,
                    verb.third_person_feminine_singular,
                    verb.first_person_plural,
                    verb.second_person_masculine_plural,
                    verb.second_person_feminine_plural,
                    verb.third_person_plural,
                    verb.imperative_masculine,
                    verb.imperative_feminine,
                    verb.imperative_plural,
                ],
            );
        }

        for (const verb of examples) {
            await client.query(
                `
                    INSERT INTO verb_examples (
                        verb_id,
                        present_example,
                        present_translation,
                        past_example,
                        past_translation,
                        future_example,
                        future_translation
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `,
                [
                    verb.id,
                    verb.present_example,
                    verb.present_translation,
                    verb.past_example,
                    verb.past_translation,
                    verb.future_example,
                    verb.future_translation,
                ],
            );
        }

        await client.query("COMMIT");

        console.log(`Verb grammar imported: ${base.length}`);
        console.log(`Present forms imported: ${present.length}`);
        console.log(`Past forms imported: ${past.length}`);
        console.log(`Future/imperative forms imported: ${futureImperative.length}`);
        console.log(`Verb examples imported: ${examples.length}`);
    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Verb grammar seed error:", error);

        process.exitCode = 1;
    } finally {
        client.release();

        await pool.end();
    }
}

seedVerbGrammar();
