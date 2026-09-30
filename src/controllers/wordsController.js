import pool from "../db.js";

export async function getWords(request, response) {
    try {
        const result = await pool.query(
            "SELECT id, hebrew, translation, category FROM words ORDER BY id",
        );

        response.status(200).json({
            count: result.rows.length,
            data: result.rows,
        });
    } catch (error) {
        response.status(500).json({
            message: "Database error",
            error: error.message,
        });
    }
}

export async function getWordById(request, response) {
    try {
        const id = Number(request.params.id);

        const result = await pool.query(
            "SELECT id, hebrew, translation, category FROM words WHERE id = $1",
            [id],
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Word not found",
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

export async function createWord(request, response) {
    try {
        const { hebrew, translation, category } = request.body;

        if (!hebrew || !translation || !category) {
            return response.status(400).json({
                message: "Missing required fields",
            });
        }

        const result = await pool.query(
            `
                INSERT INTO words (hebrew, translation, category)
                VALUES ($1, $2, $3)
                RETURNING id, hebrew, translation, category
            `,
            [hebrew, translation, category],
        );

        response.status(201).json({
            message: "Word created",
            data: result.rows[0],
        });
    } catch (error) {
        response.status(500).json({
            message: "Database error",
            error: error.message,
        });
    }
}

export async function updateWord(request, response) {
    try {
        const id = Number(request.params.id);
        const { hebrew, translation, category } = request.body;

        if (!hebrew || !translation || !category) {
            return response.status(400).json({
                message: "Missing required fields",
            });
        }

        const result = await pool.query(
            `
                UPDATE words
                SET hebrew = $1,
                    translation = $2,
                    category = $3
                WHERE id = $4
                RETURNING id, hebrew, translation, category
            `,
            [hebrew, translation, category, id],
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Word not found",
            });
        }

        response.status(200).json({
            message: "Word updated",
            data: result.rows[0],
        });
    } catch (error) {
        response.status(500).json({
            message: "Database error",
            error: error.message,
        });
    }
}

export async function deleteWord(request, response) {
    try {
        const id = Number(request.params.id);

        const result = await pool.query(
            `
                DELETE FROM words
                WHERE id = $1
                RETURNING id, hebrew, translation, category
            `,
            [id],
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Word not found",
            });
        }

        response.status(200).json({
            message: "Word deleted",
            data: result.rows[0],
        });
    } catch (error) {
        response.status(500).json({
            message: "Database error",
            error: error.message,
        });
    }
}
