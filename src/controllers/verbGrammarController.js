import pool from "../db.js";

function parseId(value) {
    const id = Number(value);

    return Number.isInteger(id) && id > 0 ? id : null;
}

async function findVerb(id) {
    const result = await pool.query(
        `
            SELECT id, hebrew, translation, level
            FROM content.verbs
            WHERE id = $1
        `,
        [id],
    );

    return result.rows[0];
}

export async function getVerbGrammarBase(request, response) {
    try {
        const id = parseId(request.params.id);

        if (id === null) {
            return response.status(400).json({
                message: "Invalid verb id",
            });
        }

        const result = await pool.query(
            `
                SELECT
                    v.id,
                    v.hebrew,
                    v.translation,
                    v.level,
                    g.government,
                    g.binyan
                FROM content.verbs v
                         JOIN content.verb_grammar g
                              ON g.verb_id = v.id
                WHERE v.id = $1
            `,
            [id],
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Verb grammar not found",
            });
        }

        response.status(200).json({
            data: result.rows[0],
        });
    } catch (error) {
        response.status(500).json({
            message: "Database error",
            error: error.message,
        });
    }
}

export async function getVerbPresent(request, response) {
    try {
        const id = parseId(request.params.id);

        if (id === null) {
            return response.status(400).json({
                message: "Invalid verb id",
            });
        }

        const verb = await findVerb(id);

        if (!verb) {
            return response.status(404).json({
                message: "Verb not found",
            });
        }

        const result = await pool.query(
            `
                SELECT
                    masculine_singular,
                    feminine_singular,
                    masculine_plural,
                    feminine_plural
                FROM content.verb_present
                WHERE verb_id = $1
            `,
            [id],
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Present forms not found",
            });
        }

        response.status(200).json({
            verb,
            data: result.rows[0],
        });
    } catch (error) {
        response.status(500).json({
            message: "Database error",
            error: error.message,
        });
    }
}

export async function getVerbPast(request, response) {
    try {
        const id = parseId(request.params.id);

        if (id === null) {
            return response.status(400).json({
                message: "Invalid verb id",
            });
        }

        const verb = await findVerb(id);

        if (!verb) {
            return response.status(404).json({
                message: "Verb not found",
            });
        }

        const result = await pool.query(
            `
                SELECT
                    first_person_singular,
                    second_person_masculine_singular,
                    second_person_feminine_singular,
                    third_person_masculine_singular,
                    third_person_feminine_singular,
                    first_person_plural,
                    second_person_masculine_plural,
                    second_person_feminine_plural,
                    third_person_plural
                FROM content.verb_past
                WHERE verb_id = $1
            `,
            [id],
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Past forms not found",
            });
        }

        response.status(200).json({
            verb,
            data: result.rows[0],
        });
    } catch (error) {
        response.status(500).json({
            message: "Database error",
            error: error.message,
        });
    }
}

export async function getVerbFuture(request, response) {
    try {
        const id = parseId(request.params.id);

        if (id === null) {
            return response.status(400).json({
                message: "Invalid verb id",
            });
        }

        const verb = await findVerb(id);

        if (!verb) {
            return response.status(404).json({
                message: "Verb not found",
            });
        }

        const result = await pool.query(
            `
                SELECT
                    first_person_singular,
                    second_person_masculine_singular,
                    second_person_feminine_singular,
                    third_person_masculine_singular,
                    third_person_feminine_singular,
                    first_person_plural,
                    second_person_masculine_plural,
                    second_person_feminine_plural,
                    third_person_plural
                FROM content.verb_future_imperative
                WHERE verb_id = $1
            `,
            [id],
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Future forms not found",
            });
        }

        response.status(200).json({
            verb,
            data: result.rows[0],
        });
    } catch (error) {
        response.status(500).json({
            message: "Database error",
            error: error.message,
        });
    }
}

export async function getVerbImperative(request, response) {
    try {
        const id = parseId(request.params.id);

        if (id === null) {
            return response.status(400).json({
                message: "Invalid verb id",
            });
        }

        const verb = await findVerb(id);

        if (!verb) {
            return response.status(404).json({
                message: "Verb not found",
            });
        }

        const result = await pool.query(
            `
                SELECT
                    imperative_masculine,
                    imperative_feminine,
                    imperative_plural
                FROM content.verb_future_imperative
                WHERE verb_id = $1
            `,
            [id],
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Imperative forms not found",
            });
        }

        response.status(200).json({
            verb,
            data: result.rows[0],
        });
    } catch (error) {
        response.status(500).json({
            message: "Database error",
            error: error.message,
        });
    }
}

export async function getVerbExamples(request, response) {
    try {
        const id = parseId(request.params.id);

        if (id === null) {
            return response.status(400).json({
                message: "Invalid verb id",
            });
        }

        const verb = await findVerb(id);

        if (!verb) {
            return response.status(404).json({
                message: "Verb not found",
            });
        }

        const result = await pool.query(
            `
                SELECT
                    present_example,
                    present_translation,
                    past_example,
                    past_translation,
                    future_example,
                    future_translation
                FROM content.verb_examples
                WHERE verb_id = $1
            `,
            [id],
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Verb examples not found",
            });
        }

        response.status(200).json({
            verb,
            data: result.rows[0],
        });
    } catch (error) {
        response.status(500).json({
            message: "Database error",
            error: error.message,
        });
    }
}
