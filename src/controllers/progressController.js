import pool from "../db.js";

const CATEGORY_MAX_LEVELS = {
    verbs: 25,
    adjectives: 25,
    adverbs: 15,
};

const CATEGORIES = Object.keys(CATEGORY_MAX_LEVELS);

async function ensureUserProgress(userId) {
    await pool.query(
        `
            INSERT INTO app.user_progress (
                user_id,
                category,
                unlocked_level
            )
            SELECT
                $1,
                category,
                1
            FROM (
                     VALUES
                         ('verbs'),
                         ('adjectives'),
                         ('adverbs')
                 ) AS categories(category)

                ON CONFLICT (
                user_id,
                category
            )
            DO NOTHING
        `,
        [userId],
    );
}

export async function getProgress(request, response) {
    try {
        await ensureUserProgress(request.userId);

        const result = await pool.query(
            `
                    SELECT
                        category,
                        unlocked_level
                    FROM app.user_progress
                    WHERE user_id = $1
                    ORDER BY category
                `,
            [request.userId],
        );

        const progress = {
            verbs: 1,
            adjectives: 1,
            adverbs: 1,
        };

        result.rows.forEach((row) => {
            if (CATEGORIES.includes(row.category)) {
                progress[row.category] = row.unlocked_level;
            }
        });

        return response.status(200).json({
            data: progress,
        });
    } catch (error) {
        console.error("Get progress error:", error);

        return response.status(500).json({
            message: "Failed to load progress",
        });
    }
}
