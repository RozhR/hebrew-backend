import "dotenv/config";

import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";

function runNodeScript(filename) {
    return new Promise((resolve, reject) => {
        const scriptPath = fileURLToPath(new URL(`./${filename}`, import.meta.url));

        const child = spawn(process.execPath, [scriptPath], {
            stdio: "inherit",
        });

        child.on("error", reject);

        child.on("close", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`${filename} failed with code ${code}`));
            }
        });
    });
}

async function resetContent() {
    if (process.env.NODE_ENV !== "development") {
        throw new Error("Content reset is allowed only when NODE_ENV=development.");
    }

    if (process.env.DB_HOST !== "localhost" && process.env.DB_HOST !== "127.0.0.1") {
        throw new Error(
            `Content reset is allowed only for a local database. Current host: ${process.env.DB_HOST}`,
        );
    }

    console.log("");
    console.log("========================================");
    console.log("       HEBREW CONTENT RESET");
    console.log("========================================");
    console.log("");
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log("");
    console.log("Only the content schema will be repopulated.");
    console.log("The app schema will not be reset.");
    console.log("");
    console.log("This will replace:");
    console.log("- vocabulary");
    console.log("- verb grammar");
    console.log("- adjective grammar");
    console.log("- adverb grammar");
    console.log("");

    const readline = createInterface({
        input,
        output,
    });

    const confirmation = await readline.question('Type "RESET CONTENT" to continue: ');

    readline.close();

    if (confirmation !== "RESET CONTENT") {
        console.log("");
        console.log("Content reset cancelled.");
        return;
    }

    console.log("");
    console.log("Creating/checking database schema...");
    await runNodeScript("createSchema.js");

    console.log("");
    console.log("Importing vocabulary...");
    await runNodeScript("seedVocabulary.js");

    console.log("");
    console.log("Importing verb grammar...");
    await runNodeScript("seedVerbGrammar.js");

    console.log("");
    console.log("Importing adjective grammar...");
    await runNodeScript("seedAdjectiveGrammar.js");

    console.log("");
    console.log("Importing adverb grammar...");
    await runNodeScript("seedAdverbGrammar.js");

    console.log("");
    console.log("========================================");
    console.log("Content reset completed successfully.");
    console.log("The app schema was not reset.");
    console.log("========================================");
}

resetContent().catch((error) => {
    console.error("");
    console.error("Content reset failed:", error.message);
    process.exit(1);
});
