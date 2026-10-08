import { CATEGORIES } from "../config/categories.js";
import pool from "../db.js";

async function ensureUserProgress(userId) {
    await pool.query(
        `
            INSERT INTO app.user_progress (user_id, category, unlocked_level)
            SELECT $1, category, 1
            FROM unnest($2::TEXT[]) AS categories(category)
            ON CONFLICT (user_id, category) DO NOTHING
        `,
        [userId, CATEGORIES],
    );
}

export async function getProgress(request, response) {
    try {
        await ensureUserProgress(request.userId);

        const result = await pool.query(
            `
                SELECT category, unlocked_level
                FROM app.user_progress
                WHERE user_id = $1
                ORDER BY category
            `,
            [request.userId],
        );

        const progress = Object.fromEntries(CATEGORIES.map((category) => [category, 1]));

        result.rows.forEach((row) => {
            if (CATEGORIES.includes(row.category)) {
                progress[row.category] = row.unlocked_level;
            }
        });

        return response.status(200).json({ data: progress });
    } catch (error) {
        console.error("Get progress error:", error);
        return response.status(500).json({ message: "Failed to load progress" });
    }
}
