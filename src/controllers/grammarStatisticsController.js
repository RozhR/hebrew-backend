import pool from "../db.js";

const VALID_SECTIONS = ["present", "past", "future", "imperative"];

function areValidSections(sections) {
    if (!Array.isArray(sections) || sections.length === 0) {
        return false;
    }

    return sections.every(
        (section) => typeof section === "string" && VALID_SECTIONS.includes(section),
    );
}

export async function getGrammarStatistics(request, response) {
    try {
        const result = await pool.query(
            `
                SELECT
                    id,
                    percent,
                    correct,
                    total,
                    sections,
                    attempted_at
                FROM app.grammar_test_statistics
                WHERE user_id = $1
                ORDER BY attempted_at ASC
            `,
            [request.userId],
        );

        const statistics = result.rows.map((row) => ({
            id: row.id,
            percent: row.percent,
            correct: row.correct,
            total: row.total,
            sections: row.sections,
            date: row.attempted_at,
        }));

        return response.status(200).json({
            data: statistics,
        });
    } catch (error) {
        console.error("Get grammar statistics error:", error);

        return response.status(500).json({
            message: "Failed to load grammar statistics",
        });
    }
}

export async function addGrammarStatistic(request, response) {
    try {
        const { correct, total, sections } = request.body;

        if (
            !Number.isInteger(correct) ||
            !Number.isInteger(total) ||
            total < 1 ||
            correct < 0 ||
            correct > total
        ) {
            return response.status(400).json({
                message: "Invalid grammar test result",
            });
        }

        if (!areValidSections(sections)) {
            return response.status(400).json({
                message: "Invalid grammar test sections",
            });
        }

        const uniqueSections = [...new Set(sections)];

        const percent = Math.round((correct / total) * 100);

        const result = await pool.query(
            `
                INSERT INTO app.grammar_test_statistics (
                    user_id,
                    percent,
                    correct,
                    total,
                    sections
                )
                VALUES ($1, $2, $3, $4, $5)

                RETURNING
                    id,
                    percent,
                    correct,
                    total,
                    sections,
                    attempted_at
            `,
            [request.userId, percent, correct, total, uniqueSections],
        );

        const row = result.rows[0];

        return response.status(201).json({
            data: {
                id: row.id,
                percent: row.percent,
                correct: row.correct,
                total: row.total,
                sections: row.sections,
                date: row.attempted_at,
            },
        });
    } catch (error) {
        console.error("Add grammar statistic error:", error);

        return response.status(500).json({
            message: "Failed to save grammar statistic",
        });
    }
}

export async function clearGrammarStatistics(request, response) {
    try {
        await pool.query(
            `
                DELETE FROM app.grammar_test_statistics
                WHERE user_id = $1
            `,
            [request.userId],
        );

        return response.status(200).json({
            message: "Grammar statistics cleared",
        });
    } catch (error) {
        console.error("Clear grammar statistics error:", error);

        return response.status(500).json({
            message: "Failed to clear grammar statistics",
        });
    }
}
