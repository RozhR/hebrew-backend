import request from "supertest";

import app from "../src/app.js";
import pool from "../src/db.js";

const adminUser = {
    email: "admin-test@example.com",
    password: "Test12345!",
    firstName: "Admin",
    lastName: "Test",
};

const regularUser = {
    email: "regular-test@example.com",
    password: "Test12345!",
    firstName: "Regular",
    lastName: "Test",
};

async function cleanTestUsers() {
    await pool.query(
        `
            DELETE FROM app.users
            WHERE email = ANY($1::TEXT[])
        `,
        [[adminUser.email, regularUser.email]],
    );
}

async function registerAndLogin(user) {
    const registerResponse = await request(app).post("/api/auth/register").send(user);

    expect(registerResponse.status).toBe(201);

    const agent = request.agent(app);

    const loginResponse = await agent.post("/api/auth/login").send({
        email: user.email,
        password: user.password,
    });

    expect(loginResponse.status).toBe(200);

    return agent;
}

describe("Admin integration", () => {
    beforeEach(async () => {
        await cleanTestUsers();
    });

    afterAll(async () => {
        await cleanTestUsers();
        await pool.end();
    });

    test("guest cannot access admin analytics", async () => {
        const response = await request(app).get("/api/admin/analytics");

        expect(response.status).toBe(401);

        expect(response.body).toEqual({
            message: "Authentication required",
        });
    });

    test("regular user cannot access admin analytics", async () => {
        const agent = await registerAndLogin(regularUser);

        const response = await agent.get("/api/admin/analytics");

        expect(response.status).toBe(403);

        expect(response.body).toEqual({
            message: "Admin access required",
        });
    });

    test("admin can access analytics", async () => {
        const agent = await registerAndLogin(adminUser);

        await pool.query(
            `
                UPDATE app.users
                SET role = 'admin'
                WHERE email = $1
            `,
            [adminUser.email],
        );

        const response = await agent.get("/api/admin/analytics");

        expect(response.status).toBe(200);

        expect(response.body.data).toEqual(
            expect.objectContaining({
                total_users: expect.any(Number),
                new_users_7d: expect.any(Number),
                active_users_7d: expect.any(Number),
                total_tests: expect.any(Number),
                total_grammar_tests: expect.any(Number),
                registrations: expect.any(Array),
                test_activity: expect.any(Array),
                categories: expect.any(Array),
                levels: expect.any(Array),
            }),
        );
    });

    test("admin loses access after role is revoked", async () => {
        const agent = await registerAndLogin(adminUser);

        await pool.query(
            `
                UPDATE app.users
                SET role = 'admin'
                WHERE email = $1
            `,
            [adminUser.email],
        );

        const adminResponse = await agent.get("/api/admin/analytics");

        expect(adminResponse.status).toBe(200);

        await pool.query(
            `
                UPDATE app.users
                SET role = 'user'
                WHERE email = $1
            `,
            [adminUser.email],
        );

        const response = await agent.get("/api/admin/analytics");

        expect(response.status).toBe(403);
    });
});
