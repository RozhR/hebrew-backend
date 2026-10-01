import pool from "../db.js";

function parseId(value) {
    const id = Number(value);

    return Number.isInteger(id) && id > 0 ? id : null;
}

async function findAdverb(id) {
    const result = await pool.query(
        `
            SELECT id, hebrew, translation, level
            FROM adverbs
            WHERE id = $1
        `,
        [id],
    );

    return result.rows[0];
}

export async function getAdverbUsage(request, response) {
    try {
        const id = parseId(request.params.id);

        if (id === null) {
            return response.status(400).json({
                message: "Invalid adverb id",
            });
        }

        const adverb = await findAdverb(id);

        if (!adverb) {
            return response.status(404).json({
                message: "Adverb not found",
            });
        }

        const result = await pool.query(
            `
                SELECT
                    main_meaning,
                    semantic_category,
                    register,
                    usage
                FROM adverb_usage
                WHERE adverb_id = $1
            `,
            [id],
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Adverb usage not found",
            });
        }

        response.status(200).json({
            adverb,
            data: result.rows[0],
        });
    } catch (error) {
        response.status(500).json({
            message: "Database error",
            error: error.message,
        });
    }
}

export async function getAdverbRelations(request, response) {
    try {
        const id = parseId(request.params.id);

        if (id === null) {
            return response.status(400).json({
                message: "Invalid adverb id",
            });
        }

        const adverb = await findAdverb(id);

        if (!adverb) {
            return response.status(404).json({
                message: "Adverb not found",
            });
        }

        const result = await pool.query(
            `
                SELECT
                    synonym,
                    antonym,
                    related_expression,
                    comment
                FROM adverb_relations
                WHERE adverb_id = $1
            `,
            [id],
        );

        response.status(200).json({
            adverb,
            data: result.rows[0] ?? null,
        });
    } catch (error) {
        response.status(500).json({
            message: "Database error",
            error: error.message,
        });
    }
}

export async function getAdverbExamples(request, response) {
    try {
        const id = parseId(request.params.id);

        if (id === null) {
            return response.status(400).json({
                message: "Invalid adverb id",
            });
        }

        const adverb = await findAdverb(id);

        if (!adverb) {
            return response.status(404).json({
                message: "Adverb not found",
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
                FROM adverb_examples
                WHERE adverb_id = $1
            `,
            [id],
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Adverb examples not found",
            });
        }

        response.status(200).json({
            adverb,
            data: result.rows[0],
        });
    } catch (error) {
        response.status(500).json({
            message: "Database error",
            error: error.message,
        });
    }
}
