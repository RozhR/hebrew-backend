import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import pool from "../db.js";

const PASSWORD_MIN_LENGTH = 8;
const SALT_ROUNDS = 12;

function createAccessToken(userId) {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }

    return jwt.sign(
        {
            sub: String(userId),
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1h",
        },
    );
}

function normalizeEmail(value) {
    return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function register(request, response) {
    try {
        const { email, password, firstName, lastName } = request.body ?? {};

        const normalizedEmail = normalizeEmail(email);

        if (
            !normalizedEmail ||
            typeof password !== "string" ||
            typeof firstName !== "string" ||
            typeof lastName !== "string"
        ) {
            return response.status(400).json({
                message: "Invalid registration data",
            });
        }

        if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return response.status(400).json({ message: "Invalid email address" });
        }

        if (password.length < PASSWORD_MIN_LENGTH) {
            return response.status(400).json({
                message: `Password must contain at least ${PASSWORD_MIN_LENGTH} characters`,
            });
        }

        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();

        if (!cleanFirstName || !cleanLastName) {
            return response.status(400).json({
                message: "First name and last name are required",
            });
        }

        if (cleanFirstName.length > 100 || cleanLastName.length > 100) {
            return response
                .status(400)
                .json({ message: "Names must contain at most 100 characters" });
        }

        if (Buffer.byteLength(password, "utf8") > 72) {
            return response
                .status(400)
                .json({ message: "Password must contain at most 72 UTF-8 bytes" });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const result = await pool.query(
            `
                INSERT INTO app.users (
                    email,
                    password_hash,
                    first_name,
                    last_name
                )
                VALUES ($1, $2, $3, $4)
                    RETURNING
                    id,
                    email,
                    first_name,
                    last_name,
                    created_at,
                    updated_at
            `,
            [normalizedEmail, passwordHash, cleanFirstName, cleanLastName],
        );

        return response.status(201).json({
            data: result.rows[0],
        });
    } catch (error) {
        if (error.code === "23505") {
            return response.status(409).json({
                message: "User with this email already exists",
            });
        }

        console.error("Registration error:", error);

        return response.status(500).json({
            message: "Registration failed",
        });
    }
}

export async function login(request, response) {
    try {
        const { email, password } = request.body ?? {};

        const normalizedEmail = normalizeEmail(email);

        if (!normalizedEmail || typeof password !== "string") {
            return response.status(400).json({
                message: "Email and password are required",
            });
        }

        const result = await pool.query(
            `
                SELECT
                    id,
                    email,
                    password_hash,
                    first_name,
                    last_name,
                    created_at,
                    updated_at
                FROM app.users
                WHERE email = $1
            `,
            [normalizedEmail],
        );

        const user = result.rows[0];

        if (!user) {
            return response.status(401).json({
                message: "Invalid email or password",
            });
        }

        const passwordMatches = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatches) {
            return response.status(401).json({
                message: "Invalid email or password",
            });
        }

        const accessToken = createAccessToken(user.id);

        const cookieName = process.env.AUTH_COOKIE_NAME || "hebrew_auth";

        const cookieMaxAge = Number(process.env.AUTH_COOKIE_MAX_AGE_MS) || 60 * 60 * 1000;

        response.cookie(cookieName, accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: cookieMaxAge,
            path: "/",
        });

        return response.status(200).json({
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    created_at: user.created_at,
                    updated_at: user.updated_at,
                },
            },
        });
    } catch (error) {
        console.error("Login error:", error);

        return response.status(500).json({
            message: "Login failed",
        });
    }
}

export function logout(request, response) {
    const cookieName = process.env.AUTH_COOKIE_NAME || "hebrew_auth";

    response.clearCookie(cookieName, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });

    return response.status(200).json({
        message: "Logged out",
    });
}
