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
