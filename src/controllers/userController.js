import pool from "../db.js";

export async function getCurrentUser(request, response) {
    try {
        const result = await pool.query(
            `
                SELECT
                    id,
                    email,
                    first_name,
                    last_name,
                    created_at,
                    updated_at
                FROM app.users
                WHERE id = $1
            `,
            [request.userId],
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "User not found",
            });
        }

        return response.status(200).json({
            data: result.rows[0],
        });
    } catch (error) {
        console.error("Get current user error:", error);

        return response.status(500).json({
            message: "Failed to load user",
        });
    }
}
