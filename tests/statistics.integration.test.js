import request from "supertest";

import app from "../src/app.js";
import pool from "../src/db.js";

const userA = {
    email: "statistics-a@example.com",
    password: "Test12345!",
    firstName: "Statistics",
    lastName: "A",
};

const userB = {
    email: "statistics-b@example.com",
    password: "Test12345!",
    firstName: "Statistics",
    lastName: "B",
};

const verbLevel1Id = 900001;
const verbLevel2Id = 900002;

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

async function cleanTestData() {
    await pool.query(
        `
            DELETE FROM app.users
            WHERE email = ANY($1::TEXT[])
        `,
        [[userA.email, userB.email]],
    );

    await pool.query(
        `
            DELETE FROM content.verbs
            WHERE id = ANY($1::INTEGER[])
        `,
        [[verbLevel1Id, verbLevel2Id]],
    );
}

describe("Statistics integration", () => {
    beforeEach(async () => {
        await cleanTestData();

        await pool.query(
            `
                INSERT INTO content.verbs (
                    id,
                    hebrew,
                    translation,
                    level
                )
                VALUES
                    ($1, 'בדיקה', 'test', 1),
                    ($2, 'לבדוק', 'to test', 2)
            `,
            [verbLevel1Id, verbLevel2Id],
        );
    });

    afterAll(async () => {
        await cleanTestData();
        await pool.end();
    });

    test("vocabulary statistics are isolated and passing unlocks next level", async () => {
        const agentA = await registerAndLogin(userA);
        const agentB = await registerAndLogin(userB);

        const saveResponse = await agentA.post("/api/statistics").send({
            category: "verbs",
            level: 1,
            correct: 1,
            total: 1,
        });

        expect(saveResponse.status).toBe(201);

        expect(saveResponse.body.data).toMatchObject({
            category: "verbs",
            level: 1,
            percent: 100,
            correct: 1,
            total: 1,
        });

        const statisticsA = await agentA.get("/api/statistics");

        expect(statisticsA.status).toBe(200);
        expect(statisticsA.body.data.verbs["1"]).toHaveLength(1);

        expect(statisticsA.body.data.verbs["1"][0]).toMatchObject({
            percent: 100,
            correct: 1,
            total: 1,
        });

        const statisticsB = await agentB.get("/api/statistics");

        expect(statisticsB.status).toBe(200);
        expect(statisticsB.body.data).toEqual({});

        const progressA = await agentA.get("/api/progress");

        expect(progressA.status).toBe(200);
        expect(progressA.body.data.verbs).toBe(2);

        const progressB = await agentB.get("/api/progress");

        expect(progressB.status).toBe(200);
        expect(progressB.body.data.verbs).toBe(1);

        const lockedLevelResponse = await agentB.post("/api/statistics").send({
            category: "verbs",
            level: 2,
            correct: 1,
            total: 1,
        });

        expect(lockedLevelResponse.status).toBe(403);
        expect(lockedLevelResponse.body).toEqual({
            message: "Level is locked",
        });

        const unlockedLevelResponse = await agentA.post("/api/statistics").send({
            category: "verbs",
            level: 2,
            correct: 0,
            total: 1,
        });

        expect(unlockedLevelResponse.status).toBe(201);
        expect(unlockedLevelResponse.body.data.percent).toBe(0);
    });

    test("grammar statistics are isolated between users and can be cleared", async () => {
        const agentA = await registerAndLogin(userA);
        const agentB = await registerAndLogin(userB);

        const saveResponse = await agentA.post("/api/statistics/grammar").send({
            correct: 3,
            total: 4,
            sections: ["present", "future", "present"],
        });

        expect(saveResponse.status).toBe(201);

        expect(saveResponse.body.data).toMatchObject({
            percent: 75,
            correct: 3,
            total: 4,
            sections: ["present", "future"],
        });

        const statisticsA = await agentA.get("/api/statistics/grammar");

        expect(statisticsA.status).toBe(200);
        expect(statisticsA.body.data).toHaveLength(1);

        expect(statisticsA.body.data[0]).toMatchObject({
            percent: 75,
            correct: 3,
            total: 4,
            sections: ["present", "future"],
        });

        const statisticsB = await agentB.get("/api/statistics/grammar");

        expect(statisticsB.status).toBe(200);
        expect(statisticsB.body.data).toEqual([]);

        const clearResponse = await agentA.delete("/api/statistics/grammar");

        expect(clearResponse.status).toBe(200);
        expect(clearResponse.body).toEqual({
            message: "Grammar statistics cleared",
        });

        const afterClear = await agentA.get("/api/statistics/grammar");

        expect(afterClear.status).toBe(200);
        expect(afterClear.body.data).toEqual([]);
    });

    test("vocabulary statistics reject invalid category", async () => {
        const agent = await registerAndLogin(userA);

        const response = await agent.post("/api/statistics").send({
            category: "unknown",
            level: 1,
            correct: 1,
            total: 1,
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: "Invalid category",
        });
    });

    test("grammar statistics reject invalid sections", async () => {
        const agent = await registerAndLogin(userA);

        const response = await agent.post("/api/statistics/grammar").send({
            correct: 3,
            total: 4,
            sections: ["present", "unknown"],
        });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            message: "Invalid grammar test sections",
        });
    });

    test("vocabulary statistics can be cleared", async () => {
        const agent = await registerAndLogin(userA);

        const saveResponse = await agent.post("/api/statistics").send({
            category: "verbs",
            level: 1,
            correct: 1,
            total: 1,
        });

        expect(saveResponse.status).toBe(201);

        const clearResponse = await agent.delete("/api/statistics");

        expect(clearResponse.status).toBe(200);
        expect(clearResponse.body).toEqual({
            message: "Statistics cleared",
        });

        const statisticsResponse = await agent.get("/api/statistics");

        expect(statisticsResponse.status).toBe(200);
        expect(statisticsResponse.body.data).toEqual({});
    });
});
