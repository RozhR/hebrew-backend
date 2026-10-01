import pool from "../db.js";

function parseId(value) {
    const id = Number(value);

    return Number.isInteger(id) && id > 0 ? id : null;
}

async function findAdjective(id) {
    const result = await pool.query(
        `
            SELECT id, hebrew, translation, level
            FROM adjectives
            WHERE id = $1
        `,
        [id],
    );

    return result.rows[0];
}

export async function getAdjectiveForms(request, response) {
    try {
        const id = parseId(request.params.id);

        if (id === null) {
            return response.status(400).json({
                message: "Invalid adjective id",
            });
        }

        const adjective = await findAdjective(id);

        if (!adjective) {
            return response.status(404).json({
                message: "Adjective not found",
            });
        }

        const result = await pool.query(
            `
                SELECT
                    masculine_singular,
                    feminine_singular,
                    masculine_plural,
                    feminine_plural
                FROM adjective_forms
                WHERE adjective_id = $1
            `,
            [id],
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Adjective forms not found",
            });
        }

        response.status(200).json({
            adjective,
            data: result.rows[0],
        });
    } catch (error) {
        response.status(500).json({
            message: "Database error",
            error: error.message,
        });
    }
}

export async function getAdjectiveConstruction(request, response) {
    try {
        const id = parseId(request.params.id);

        if (id === null) {
            return response.status(400).json({
                message: "Invalid adjective id",
            });
        }

        const adjective = await findAdjective(id);

        if (!adjective) {
            return response.status(404).json({
                message: "Adjective not found",
            });
        }

        const result = await pool.query(
            `
                SELECT
                    construction,
                    meaning
                FROM adjective_constructions
                WHERE adjective_id = $1
            `,
            [id],
        );

        response.status(200).json({
            adjective,
            data: result.rows[0] ?? null,
        });
    } catch (error) {
        response.status(500).json({
            message: "Database error",
            error: error.message,
        });
    }
}

export async function getAdjectiveExamples(request, response) {
    try {
        const id = parseId(request.params.id);

        if (id === null) {
            return response.status(400).json({
                message: "Invalid adjective id",
            });
        }

        const adjective = await findAdjective(id);

        if (!adjective) {
            return response.status(404).json({
                message: "Adjective not found",
            });
        }

        const result = await pool.query(
            `
                SELECT
                    example1,
                    translation1,
                    example2,
                    translation2,
                    example3,
                    translation3
                FROM adjective_examples
                WHERE adjective_id = $1
            `,
            [id],
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Adjective examples not found",
            });
        }

        response.status(200).json({
            adjective,
            data: result.rows[0],
        });
    } catch (error) {
        response.status(500).json({
            message: "Database error",
            error: error.message,
        });
    }
}
