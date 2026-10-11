import pool from "../db.js";

export async function requireAdmin(request, response, next) {
    try {
        if (!request.userId) {
            return response.status(401).json({
                message: "Authentication required",
            });
        }

        const result = await pool.query(
            `
                SELECT role
                FROM app.users
                WHERE id = $1
            `,
            [request.userId],
        );

        if (result.rows.length === 0) {
            return response.status(401).json({
                message: "User not found",
            });
        }

        if (result.rows[0].role !== "admin") {
            return response.status(403).json({
                message: "Admin access required",
            });
        }

        return next();
    } catch (error) {
        console.error("Admin authorization error:", error);

        return response.status(500).json({
            message: "Authorization check failed",
        });
    }
}
