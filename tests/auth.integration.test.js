import request from "supertest";

import app from "../src/app.js";
import pool from "../src/db.js";

const testUser = {
    email: "jest-user@example.com",
    password: "Test12345!",
    firstName: "Jest",
    lastName: "User",
};

describe("Auth integration", () => {
    beforeEach(async () => {
        await pool.query(
            `
                DELETE FROM app.users
                WHERE email = $1
            `,
            [testUser.email],
        );
    });

    afterAll(async () => {
        await pool.query(
            `
                DELETE FROM app.users
                WHERE email = $1
            `,
            [testUser.email],
        );

        await pool.end();
    });

    test("POST /api/auth/register creates user in database", async () => {
        const response = await request(app).post("/api/auth/register").send(testUser);

        expect(response.status).toBe(201);

        expect(response.body.data).toMatchObject({
            email: testUser.email,
            first_name: testUser.firstName,
            last_name: testUser.lastName,
        });

        expect(response.body.data).not.toHaveProperty("password_hash");

        const result = await pool.query(
            `
                SELECT
                    email,
                    password_hash,
                    first_name,
                    last_name
                FROM app.users
                WHERE email = $1
            `,
            [testUser.email],
        );

        expect(result.rows).toHaveLength(1);

        expect(result.rows[0].email).toBe(testUser.email);
        expect(result.rows[0].first_name).toBe(testUser.firstName);
        expect(result.rows[0].last_name).toBe(testUser.lastName);

        expect(result.rows[0].password_hash).not.toBe(testUser.password);
    });

    test("POST /api/auth/login sets cookie and allows access to /api/users/me", async () => {
        await request(app).post("/api/auth/register").send(testUser);

        const agent = request.agent(app);

        const loginResponse = await agent.post("/api/auth/login").send({
            email: testUser.email,
            password: testUser.password,
        });

        expect(loginResponse.status).toBe(200);

        expect(loginResponse.body.data.user).toMatchObject({
            email: testUser.email,
            first_name: testUser.firstName,
            last_name: testUser.lastName,
        });

        const cookies = loginResponse.headers["set-cookie"];

        expect(cookies).toBeDefined();

        expect(cookies.some((cookie) => cookie.startsWith("hebrew_auth="))).toBe(true);

        expect(cookies.some((cookie) => cookie.includes("HttpOnly"))).toBe(true);

        const meResponse = await agent.get("/api/users/me");

        expect(meResponse.status).toBe(200);

        expect(meResponse.body.data).toMatchObject({
            email: testUser.email,
            first_name: testUser.firstName,
            last_name: testUser.lastName,
        });
    });

    test("POST /api/auth/login rejects wrong password", async () => {
        await request(app).post("/api/auth/register").send(testUser);

        const response = await request(app).post("/api/auth/login").send({
            email: testUser.email,
            password: "WrongPassword123!",
        });

        expect(response.status).toBe(401);

        expect(response.body).toEqual({
            message: "Invalid email or password",
        });
    });
});
