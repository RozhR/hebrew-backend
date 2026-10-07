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
        const response = await request(app)
            .post("/api/auth/register")
            .send({});

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: "Invalid registration data",
        });
    });

    test("POST /api/auth/register rejects short password", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
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
        const response = await request(app)
            .post("/api/auth/login")
            .send({});

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
});