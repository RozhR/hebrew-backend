import dotenv from "dotenv";

dotenv.config({
    path: ".env.test",
    override: true,
    quiet: true,
});

process.env.NODE_ENV = "test";

if (process.env.DB_NAME !== "hebrew_learning_test") {
    throw new Error("Tests must run only with the hebrew_learning_test database");
}
