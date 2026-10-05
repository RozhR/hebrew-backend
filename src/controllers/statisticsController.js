import { CATEGORY_MAX_LEVELS } from "../config/categories.js";
import pool from "../db.js";

const PASS_PERCENT = 85;
const VOCABULARY_TEST_TOTAL = 20;

export async function getStatistics(request, response) {
    try {
        const result = await pool.query(
            `
                SELECT category, level, percent, correct, total, attempted_at
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

        return response.status(200).json({ data: statistics });
    } catch (error) {
        console.error("Get statistics error:", error);
        return response.status(500).json({ message: "Failed to load statistics" });
    }
}

export async function addStatistic(request, response) {
    const client = await pool.connect();

    try {
        const { category, level, correct, total } = request.body;
        const maxLevel = CATEGORY_MAX_LEVELS[category];

        if (!maxLevel) {
            return response.status(400).json({ message: "Invalid category" });
        }

        if (!Number.isInteger(level) || level < 1 || level > maxLevel) {
            return response.status(400).json({ message: "Invalid level" });
        }

        if (
            !Number.isInteger(correct) ||
            !Number.isInteger(total) ||
            total !== VOCABULARY_TEST_TOTAL ||
            correct < 0 ||
            correct > total
        ) {
            return response.status(400).json({ message: "Invalid test result" });
        }

        const percent = Math.round((correct / total) * 100);

        await client.query("BEGIN");

        await client.query(
            `
                INSERT INTO app.user_progress (user_id, category, unlocked_level)
                VALUES ($1, $2, 1)
                ON CONFLICT (user_id, category) DO NOTHING
            `,
            [request.userId, category],
        );

        // Lock progress until the result and possible level unlock are committed together.
        const progressResult = await client.query(
            `
                SELECT unlocked_level
                FROM app.user_progress
                WHERE user_id = $1 AND category = $2
                FOR UPDATE
            `,
            [request.userId, category],
        );

        const unlockedLevel = progressResult.rows[0]?.unlocked_level;

        if (!Number.isInteger(unlockedLevel)) {
            throw new Error("User progress not found");
        }

        if (level > unlockedLevel) {
            await client.query("ROLLBACK");
            return response.status(403).json({ message: "Level is locked" });
        }

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
                RETURNING id, category, level, percent, correct, total, attempted_at
            `,
            [request.userId, category, level, percent, correct, total],
        );

        if (percent >= PASS_PERCENT && level < maxLevel) {
            await client.query(
                `
                    UPDATE app.user_progress
                    SET
                        unlocked_level = GREATEST(unlocked_level, $3),
                        updated_at = NOW()
                    WHERE user_id = $1 AND category = $2
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
        try {
            await client.query("ROLLBACK");
        } catch {
            // The transaction may already be closed.
        }

        console.error("Add statistic error:", error);
        return response.status(500).json({ message: "Failed to save statistics" });
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

        return response.status(200).json({ message: "Statistics cleared" });
    } catch (error) {
        console.error("Clear statistics error:", error);
        return response.status(500).json({ message: "Failed to clear statistics" });
    }
}
