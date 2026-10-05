import pool from "../db.js";

const MAX_BATCH_SIZE = 100;

function parseIds(value) {
    if (typeof value !== "string" || value.trim() === "") {
        return [];
    }

    const ids = [
        ...new Set(
            value
                .split(",")
                .map(Number)
                .filter((id) => Number.isInteger(id) && id > 0),
        ),
    ];

    return ids.length <= MAX_BATCH_SIZE ? ids : null;
}

function getIds(request, response) {
    const ids = parseIds(request.query.ids);

    if (ids === null) {
        response.status(400).json({
            message: `A maximum of ${MAX_BATCH_SIZE} words can be requested at once`,
        });
        return null;
    }

    if (ids.length === 0) {
        response.status(400).json({ message: "At least one valid word id is required" });
        return null;
    }

    return ids;
}

export async function getVerbGrammars(request, response) {
    const ids = getIds(request, response);

    if (!ids) {
        return;
    }

    try {
        const result = await pool.query(
            `
                SELECT
                    v.id,
                    v.hebrew,
                    v.translation,
                    v.level,
                    g.government,
                    g.binyan,
                    p.masculine_singular AS present_masculine_singular,
                    p.feminine_singular AS present_feminine_singular,
                    p.masculine_plural AS present_masculine_plural,
                    p.feminine_plural AS present_feminine_plural,
                    pa.first_person_singular AS past_first_person_singular,
                    pa.second_person_masculine_singular AS past_second_person_masculine_singular,
                    pa.second_person_feminine_singular AS past_second_person_feminine_singular,
                    pa.third_person_masculine_singular AS past_third_person_masculine_singular,
                    pa.third_person_feminine_singular AS past_third_person_feminine_singular,
                    pa.first_person_plural AS past_first_person_plural,
                    pa.second_person_masculine_plural AS past_second_person_masculine_plural,
                    pa.second_person_feminine_plural AS past_second_person_feminine_plural,
                    pa.third_person_plural AS past_third_person_plural,
                    f.first_person_singular AS future_first_person_singular,
                    f.second_person_masculine_singular AS future_second_person_masculine_singular,
                    f.second_person_feminine_singular AS future_second_person_feminine_singular,
                    f.third_person_masculine_singular AS future_third_person_masculine_singular,
                    f.third_person_feminine_singular AS future_third_person_feminine_singular,
                    f.first_person_plural AS future_first_person_plural,
                    f.second_person_masculine_plural AS future_second_person_masculine_plural,
                    f.second_person_feminine_plural AS future_second_person_feminine_plural,
                    f.third_person_plural AS future_third_person_plural,
                    f.imperative_masculine,
                    f.imperative_feminine,
                    f.imperative_plural,
                    e.present_example,
                    e.present_translation,
                    e.past_example,
                    e.past_translation,
                    e.future_example,
                    e.future_translation
                FROM content.verbs AS v
                JOIN content.verb_grammar AS g ON g.verb_id = v.id
                JOIN content.verb_present AS p ON p.verb_id = v.id
                JOIN content.verb_past AS pa ON pa.verb_id = v.id
                JOIN content.verb_future_imperative AS f ON f.verb_id = v.id
                JOIN content.verb_examples AS e ON e.verb_id = v.id
                WHERE v.id = ANY($1::INTEGER[])
                ORDER BY v.id
            `,
            [ids],
        );

        const data = result.rows.map((row) => ({
            base: {
                id: row.id,
                infinitive: row.hebrew,
                translation: row.translation,
                government: row.government,
                level: row.level,
            },
            present: {
                id: row.id,
                infinitive: row.hebrew,
                binyan: row.binyan,
                masculine_singular: row.present_masculine_singular,
                feminine_singular: row.present_feminine_singular,
                masculine_plural: row.present_masculine_plural,
                feminine_plural: row.present_feminine_plural,
            },
            past: {
                id: row.id,
                infinitive: row.hebrew,
                first_person_singular: row.past_first_person_singular,
                second_person_masculine_singular: row.past_second_person_masculine_singular,
                second_person_feminine_singular: row.past_second_person_feminine_singular,
                third_person_masculine_singular: row.past_third_person_masculine_singular,
                third_person_feminine_singular: row.past_third_person_feminine_singular,
                first_person_plural: row.past_first_person_plural,
                second_person_masculine_plural: row.past_second_person_masculine_plural,
                second_person_feminine_plural: row.past_second_person_feminine_plural,
                third_person_plural: row.past_third_person_plural,
            },
            future: {
                id: row.id,
                infinitive: row.hebrew,
                first_person_singular: row.future_first_person_singular,
                second_person_masculine_singular: row.future_second_person_masculine_singular,
                second_person_feminine_singular: row.future_second_person_feminine_singular,
                third_person_masculine_singular: row.future_third_person_masculine_singular,
                third_person_feminine_singular: row.future_third_person_feminine_singular,
                first_person_plural: row.future_first_person_plural,
                second_person_masculine_plural: row.future_second_person_masculine_plural,
                second_person_feminine_plural: row.future_second_person_feminine_plural,
                third_person_plural: row.future_third_person_plural,
                imperative_masculine: row.imperative_masculine,
                imperative_feminine: row.imperative_feminine,
                imperative_plural: row.imperative_plural,
            },
            examples: {
                id: row.id,
                infinitive: row.hebrew,
                translation: row.translation,
                present_example: row.present_example,
                present_translation: row.present_translation,
                past_example: row.past_example,
                past_translation: row.past_translation,
                future_example: row.future_example,
                future_translation: row.future_translation,
            },
        }));

        return response.status(200).json({ data });
    } catch (error) {
        console.error("Get verb grammar error:", error);
        return response.status(500).json({ message: "Failed to load verb grammar" });
    }
}

export async function getAdjectiveGrammars(request, response) {
    const ids = getIds(request, response);

    if (!ids) {
        return;
    }

    try {
        const result = await pool.query(
            `
                SELECT
                    a.id,
                    a.hebrew,
                    a.translation,
                    a.level,
                    f.masculine_singular,
                    f.feminine_singular,
                    f.masculine_plural,
                    f.feminine_plural,
                    c.construction,
                    c.meaning,
                    e.example1,
                    e.translation1,
                    e.example2,
                    e.translation2,
                    e.example3,
                    e.translation3
                FROM content.adjectives AS a
                JOIN content.adjective_forms AS f ON f.adjective_id = a.id
                JOIN content.adjective_examples AS e ON e.adjective_id = a.id
                LEFT JOIN content.adjective_constructions AS c ON c.adjective_id = a.id
                WHERE a.id = ANY($1::INTEGER[])
                ORDER BY a.id
            `,
            [ids],
        );

        const data = result.rows.map((row) => ({
            base: {
                id: row.id,
                masculine_singular: row.masculine_singular,
                feminine_singular: row.feminine_singular,
                masculine_plural: row.masculine_plural,
                feminine_plural: row.feminine_plural,
                translation: row.translation,
                level: row.level,
            },
            construction: row.construction
                ? {
                      id: row.id,
                      adjective: row.hebrew,
                      construction: row.construction,
                      meaning: row.meaning,
                  }
                : undefined,
            examples: {
                id: row.id,
                adjective: row.hebrew,
                translation: row.translation,
                example1: row.example1,
                translation1: row.translation1,
                example2: row.example2,
                translation2: row.translation2,
                example3: row.example3,
                translation3: row.translation3,
            },
        }));

        return response.status(200).json({ data });
    } catch (error) {
        console.error("Get adjective grammar error:", error);
        return response.status(500).json({ message: "Failed to load adjective grammar" });
    }
}

export async function getAdverbGrammars(request, response) {
    const ids = getIds(request, response);

    if (!ids) {
        return;
    }

    try {
        const result = await pool.query(
            `
                SELECT
                    a.id,
                    a.hebrew,
                    a.translation,
                    a.level,
                    u.main_meaning,
                    u.semantic_category,
                    u.register,
                    u.usage,
                    r.synonym,
                    r.antonym,
                    r.related_expression,
                    r.comment,
                    e.example1,
                    e.translation1,
                    e.example2,
                    e.translation2,
                    e.example3,
                    e.translation3
                FROM content.adverbs AS a
                JOIN content.adverb_usage AS u ON u.adverb_id = a.id
                JOIN content.adverb_examples AS e ON e.adverb_id = a.id
                LEFT JOIN content.adverb_relations AS r ON r.adverb_id = a.id
                WHERE a.id = ANY($1::INTEGER[])
                ORDER BY a.id
            `,
            [ids],
        );

        const data = result.rows.map((row) => ({
            base: {
                id: row.id,
                adverb: row.hebrew,
                translation: row.translation,
                category: row.semantic_category,
                level: row.level,
            },
            usage: {
                id: row.id,
                adverb: row.hebrew,
                main_meaning: row.main_meaning,
                category: row.semantic_category,
                register: row.register,
                usage: row.usage,
            },
            relation:
                row.synonym !== null
                    ? {
                          id: row.id,
                          adverb: row.hebrew,
                          synonym: row.synonym,
                          antonym: row.antonym,
                          related_expression: row.related_expression,
                          comment: row.comment,
                      }
                    : undefined,
            examples: {
                id: row.id,
                adverb: row.hebrew,
                category: row.semantic_category,
                example1: row.example1,
                translation1: row.translation1,
                example2: row.example2,
                translation2: row.translation2,
                example3: row.example3,
                translation3: row.translation3,
            },
        }));

        return response.status(200).json({ data });
    } catch (error) {
        console.error("Get adverb grammar error:", error);
        return response.status(500).json({ message: "Failed to load adverb grammar" });
    }
}
