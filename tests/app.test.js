import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import pool from "../src/db.js";

import request from "supertest";

import app from "../src/app.js";

describe("App", () => {
    test("GET /api/health returns API status", async () => {
        const response = await request(app).get("/api/health");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            status: "ok",
            message: "Hebrew Learning API is running",
        });
    });

    test("unknown route returns 404", async () => {
        const response = await request(app).get("/api/does-not-exist");

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            message: "Route not found",
        });
    });
});

describe("Auth", () => {
    test("POST /api/auth/register rejects invalid data", async () => {
        const response = await request(app).post("/api/auth/register").send({});

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: "Invalid registration data",
        });
    });

    test("POST /api/auth/register rejects short password", async () => {
        const response = await request(app).post("/api/auth/register").send({
            email: "test@example.com",
            password: "123",
            firstName: "Test",
            lastName: "User",
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: "Password must contain at least 8 characters",
        });
    });

    test("POST /api/auth/login requires email and password", async () => {
        const response = await request(app).post("/api/auth/login").send({});

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: "Email and password are required",
        });
    });

    test("GET /api/users/me requires authentication", async () => {
        const response = await request(app).get("/api/users/me");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            message: "Authentication required",
        });
    });

    test("POST /api/auth/logout returns success", async () => {
        const response = await request(app).post("/api/auth/logout");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: "Logged out",
        });
    });

    test("GET /api/users/me rejects invalid token", async () => {
        const originalJwtSecret = process.env.JWT_SECRET;
        process.env.JWT_SECRET = "test-secret";

        const cookieName = process.env.AUTH_COOKIE_NAME || "hebrew_auth";

        const response = await request(app)
            .get("/api/users/me")
            .set("Cookie", [`${cookieName}=invalid-token`]);

        process.env.JWT_SECRET = originalJwtSecret;

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            message: "Invalid or expired access token",
        });
    });

    test("GET /api/statistics requires authentication", async () => {
        const response = await request(app).get("/api/statistics");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            message: "Authentication required",
        });
    });

    test("GET /api/progress requires authentication", async () => {
        const response = await request(app).get("/api/progress");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            message: "Authentication required",
        });
    });
});

describe("API failure handling", () => {
    test("malformed JSON returns a JSON error and API remains available", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .set("Content-Type", "application/json")
            .send("{");
        expect(response.status).toBe(400);
        expect(response.type).toBe("application/json");
        expect(response.body).toEqual({ message: "Invalid JSON body" });
        expect((await request(app).get("/api/health")).status).toBe(200);
    });

    test.each(["not-an-email", "a@", "a b@example.com"])(
        "registration rejects invalid email %s before database access",
        async (email) => {
            const response = await request(app)
                .post("/api/auth/register")
                .send({ email, password: "Test12345!", firstName: "Test", lastName: "User" });
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: "Invalid email address" });
        },
    );

    test("registration rejects passwords that bcrypt would truncate", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                email: "test@example.com",
                password: "я".repeat(37),
                firstName: "Test",
                lastName: "User",
            });
        expect(response.status).toBe(400);
        expect(response.body.message).toContain("72 UTF-8 bytes");
    });

    test("statistics connection failure returns JSON and leaves API available", async () => {
        const originalSecret = process.env.JWT_SECRET;
        process.env.JWT_SECRET = "failure-test-secret";
        const connect = jest
            .spyOn(pool, "connect")
            .mockRejectedValueOnce(new Error("Database unavailable"));
        const log = jest.spyOn(console, "error").mockImplementation(() => {});
        try {
            const token = jwt.sign({ sub: "1" }, process.env.JWT_SECRET);
            const cookieName = process.env.AUTH_COOKIE_NAME || "hebrew_auth";
            const response = await request(app)
                .post("/api/statistics")
                .set("Cookie", `${cookieName}=${token}`)
                .send({ category: "verbs", level: 1, correct: 20, total: 20 });
            expect(response.status).toBe(500);
            expect(response.type).toBe("application/json");
            expect(response.body).toEqual({ message: "Failed to save statistics" });
            expect((await request(app).get("/api/health")).status).toBe(200);
        } finally {
            connect.mockRestore();
            log.mockRestore();
            if (originalSecret === undefined) delete process.env.JWT_SECRET;
            else process.env.JWT_SECRET = originalSecret;
        }
    });
});
