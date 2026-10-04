import jwt from "jsonwebtoken";

export function requireAuth(request, response, next) {
    const cookieName = process.env.AUTH_COOKIE_NAME || "hebrew_auth";

    const token = request.cookies?.[cookieName];

    if (!token) {
        return response.status(401).json({
            message: "Authentication required",
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not configured");

        return response.status(500).json({
            message: "Server configuration error",
        });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);

        const userId = Number(payload.sub);

        if (!Number.isInteger(userId) || userId < 1) {
            return response.status(401).json({
                message: "Invalid access token",
            });
        }

        request.userId = userId;

        return next();
    } catch {
        return response.status(401).json({
            message: "Invalid or expired access token",
        });
    }
}
