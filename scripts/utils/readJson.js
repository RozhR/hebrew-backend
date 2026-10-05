import { readFile } from "node:fs/promises";

export async function readJson(path, baseUrl) {
    const file = await readFile(new URL(path, baseUrl), "utf8");
    return JSON.parse(file);
}
