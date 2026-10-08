import { getCategoryConfig } from "../config/categories.js";
import pool from "../db.js";

function getCategoryTable(category) {
    return getCategoryConfig(category)?.table ?? null;
}

export async function getGrammarWords(request, response) {
    try {
        const result = await pool.query(
            `
                SELECT
                    category,
                    word_id
                FROM app.user_grammar_words
                WHERE user_id = $1
                ORDER BY created_at ASC
            `,
            [request.userId],
        );

        const words = result.rows.map((row) => ({
            category: row.category,
            id: row.word_id,
        }));

        return response.status(200).json({
            data: words,
        });
    } catch (error) {
        console.error("Get grammar words error:", error);

        return response.status(500).json({
            message: "Failed to load grammar words",
        });
    }
}

export async function addGrammarWord(request, response) {
    try {
        const { category, id } = request.body ?? {};

        const table = getCategoryTable(category);

        if (!table) {
            return response.status(400).json({
                message: "Invalid category",
            });
        }

        if (!Number.isInteger(id) || id < 1) {
            return response.status(400).json({
                message: "Invalid word id",
            });
        }

        const wordResult = await pool.query(
            `
                    SELECT id
                    FROM ${table}
                    WHERE id = $1
                `,
            [id],
        );

        if (wordResult.rowCount === 0) {
            return response.status(404).json({
                message: "Word not found",
            });
        }

        const result = await pool.query(
            `
                    INSERT INTO app.user_grammar_words (
                        user_id,
                        category,
                        word_id
                    )
                    VALUES ($1, $2, $3)

                    ON CONFLICT (
                        user_id,
                        category,
                        word_id
                    )
                    DO NOTHING

                    RETURNING
                        category,
                        word_id
                `,
            [request.userId, category, id],
        );

        const row = result.rows[0];

        return response.status(row ? 201 : 200).json({
            data: {
                category,
                id,
            },
        });
    } catch (error) {
        console.error("Add grammar word error:", error);

        return response.status(500).json({
            message: "Failed to add grammar word",
        });
    }
}

export async function removeGrammarWord(request, response) {
    try {
        const { category, id } = request.params;

        if (!getCategoryTable(category)) {
            return response.status(400).json({
                message: "Invalid category",
            });
        }

        const wordId = Number(id);

        if (!Number.isInteger(wordId) || wordId < 1) {
            return response.status(400).json({
                message: "Invalid word id",
            });
        }

        await pool.query(
            `
                DELETE FROM app.user_grammar_words
                WHERE
                    user_id = $1
                    AND category = $2
                    AND word_id = $3
            `,
            [request.userId, category, wordId],
        );

        return response.status(200).json({
            message: "Grammar word removed",
        });
    } catch (error) {
        console.error("Remove grammar word error:", error);

        return response.status(500).json({
            message: "Failed to remove grammar word",
        });
    }
}

export async function clearGrammarWords(request, response) {
    try {
        await pool.query(
            `
                DELETE FROM app.user_grammar_words
                WHERE user_id = $1
            `,
            [request.userId],
        );

        return response.status(200).json({
            message: "Grammar words cleared",
        });
    } catch (error) {
        console.error("Clear grammar words error:", error);

        return response.status(500).json({
            message: "Failed to clear grammar words",
        });
    }
}
