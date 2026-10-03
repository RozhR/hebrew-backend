import pool from "../db.js";

const PASS_PERCENT = 85;

const CATEGORY_MAX_LEVELS = {
    verbs: 25,
    adjectives: 25,
    adverbs: 15,
};

export async function getStatistics(request, response) {
    try {
        const result = await pool.query(
            `
                SELECT
                    category,
                    level,
                    percent,
                    correct,
                    total,
                    attempted_at
                FROM app.test_statistics
                WHERE user_id = $1
                ORDER BY attempted_at ASC
            `,
            [request.userId],
        );

        const statistics = {};

        result.rows.forEach((row) => {
            statistics[row.category] ??= {};
            statistics[row.category][row.level] ??= [];

            statistics[row.category][row.level].push({
                percent: row.percent,
                correct: row.correct,
                total: row.total,
                date: row.attempted_at,
            });
        });

        return response.status(200).json({
            data: statistics,
        });
    } catch (error) {
        console.error("Get statistics error:", error);

        return response.status(500).json({
            message: "Failed to load statistics",
        });
    }
}

export async function addStatistic(request, response) {
    const client = await pool.connect();

    try {
        const { category, level, correct, total } = request.body;

        const maxLevel = CATEGORY_MAX_LEVELS[category];

        if (!maxLevel) {
            return response.status(400).json({
                message: "Invalid category",
            });
        }

        if (!Number.isInteger(level) || level < 1 || level > maxLevel) {
            return response.status(400).json({
                message: "Invalid level",
            });
        }

        if (
            !Number.isInteger(correct) ||
            !Number.isInteger(total) ||
            total < 1 ||
            correct < 0 ||
            correct > total
        ) {
            return response.status(400).json({
                message: "Invalid test result",
            });
        }

        const percent = Math.round((correct / total) * 100);

        await client.query("BEGIN");

        const statisticResult = await client.query(
            `
                INSERT INTO app.test_statistics (
                    user_id,
                    category,
                    level,
                    percent,
                    correct,
                    total
                )
                VALUES ($1, $2, $3, $4, $5, $6)

                RETURNING
                    id,
                    category,
                    level,
                    percent,
                    correct,
                    total,
                    attempted_at
            `,
            [request.userId, category, level, percent, correct, total],
        );

        if (percent >= PASS_PERCENT && level < maxLevel) {
            await client.query(
                `
                    INSERT INTO app.user_progress (
                        user_id,
                        category,
                        unlocked_level,
                        updated_at
                    )
                    VALUES ($1, $2, $3, NOW())

                    ON CONFLICT (user_id, category)
                    DO UPDATE SET
                        unlocked_level = GREATEST(
                            app.user_progress.unlocked_level,
                            EXCLUDED.unlocked_level
                        ),
                        updated_at = NOW()
                `,
                [request.userId, category, level + 1],
            );
        }

        await client.query("COMMIT");

        const row = statisticResult.rows[0];

        return response.status(201).json({
            data: {
                id: row.id,
                category: row.category,
                level: row.level,
                percent: row.percent,
                correct: row.correct,
                total: row.total,
                date: row.attempted_at,
            },
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Add statistic error:", error);

        return response.status(500).json({
            message: "Failed to save statistics",
        });
    } finally {
        client.release();
    }
}

export async function clearStatistics(request, response) {
    try {
        await pool.query(
            `
                DELETE FROM app.test_statistics
                WHERE user_id = $1
            `,
            [request.userId],
        );

        return response.status(200).json({
            message: "Statistics cleared",
        });
    } catch (error) {
        console.error("Clear statistics error:", error);

        return response.status(500).json({
            message: "Failed to clear statistics",
        });
    }
}
