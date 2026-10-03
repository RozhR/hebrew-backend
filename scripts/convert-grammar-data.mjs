import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const ROOT = process.cwd();
const INPUT = path.join(ROOT, "content", "grammar");
const OUTPUT = path.join(ROOT, "database", "seed-data");

const files = {
    verbsBase: ["hebrew_verbs_500_table_1_frequency_sorted.xlsx", "verbs/base.json"],

    verbsPresent: ["hebrew_verbs_500_table_2_present.xlsx", "verbs/present.json"],

    verbsPast: ["hebrew_verbs_500_table_3_past.xlsx", "verbs/past.json"],

    verbsFutureImperative: [
        "hebrew_verbs_500_table_4_future_imperative.xlsx",
        "verbs/futureImperative.json",
    ],

    verbsExamples: ["hebrew_verbs_500_table_5_examples.xlsx", "verbs/examples.json"],

    adjectivesBase: ["hebrew_adjectives_table_1_frequency_sorted.xlsx", "adjectives/base.json"],

    adjectivesConstructions: [
        "hebrew_adjectives_table_4_government_constructions.xlsx",
        "adjectives/constructions.json",
    ],

    adjectivesExamples: ["hebrew_adjectives_table_5_examples.xlsx", "adjectives/examples.json"],

    adverbsBase: ["hebrew_adverbs_300_table_1_frequency_sorted.xlsx", "adverbs/base.json"],

    adverbsUsage: ["hebrew_adverbs_300_table_3_meanings_usage.xlsx", "adverbs/usage.json"],

    adverbsRelations: ["hebrew_adverbs_300_table_4_relations.xlsx", "adverbs/relations.json"],

    adverbsExamples: ["hebrew_adverbs_300_table_5_examples.xlsx", "adverbs/examples.json"],
};

function readSheet(fileName) {
    const filePath = path.join(INPUT, fileName);

    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const workbook = XLSX.readFile(filePath, { cellDates: false });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
        throw new Error(`No worksheets in ${fileName}`);
    }

    const sheet = workbook.Sheets[firstSheetName];

    return XLSX.utils.sheet_to_json(sheet, {
        defval: "",
        raw: true,
    });
}

function asInteger(value, field, fileName) {
    const number = Number(value);

    if (!Number.isInteger(number)) {
        throw new Error(`${fileName}: ${field}="${value}" is not an integer`);
    }

    return number;
}

function normalizeRows(rows, fileName) {
    return rows.map((row) => {
        if (!("id" in row)) {
            throw new Error(`${fileName}: missing "id" column`);
        }

        const cleanedRow = Object.fromEntries(
            Object.entries(row).filter(([key]) => !key.startsWith("__EMPTY")),
        );

        const normalized = {
            ...cleanedRow,
            id: asInteger(cleanedRow.id, "id", fileName),
        };

        if ("level" in normalized) {
            normalized.level = asInteger(normalized.level, "level", fileName);
        }

        return normalized;
    });
}

function assertUniqueIds(rows, fileName) {
    const ids = new Set();

    for (const row of rows) {
        if (ids.has(row.id)) {
            throw new Error(`${fileName}: duplicate id ${row.id}`);
        }

        ids.add(row.id);
    }
}

function assertContinuousIds(rows, maxId, fileName) {
    const ids = rows.map((row) => row.id);

    if (ids.length !== maxId) {
        throw new Error(`${fileName}: expected ${maxId} rows, got ${ids.length}`);
    }

    for (let id = 1; id <= maxId; id += 1) {
        if (ids[id - 1] !== id) {
            throw new Error(`${fileName}: expected id ${id}, got ${ids[id - 1]}`);
        }
    }
}

function makeIndex(rows) {
    return new Map(rows.map((row) => [row.id, row]));
}

function assertWordMatches({ rows, baseIndex, sourceField, baseField, fileName }) {
    for (const row of rows) {
        const base = baseIndex.get(row.id);

        if (!base) {
            throw new Error(`${fileName}: id ${row.id} does not exist in base table`);
        }

        if (row[sourceField] !== base[baseField]) {
            throw new Error(
                `${fileName}: word mismatch at id ${row.id}: ` +
                    `"${row[sourceField]}" !== "${base[baseField]}"`,
            );
        }
    }
}

function writeJson(relativePath, data) {
    const outputPath = path.join(OUTPUT, relativePath);

    fs.mkdirSync(path.dirname(outputPath), {
        recursive: true,
    });

    fs.writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const data = {};

for (const [key, [inputFile]] of Object.entries(files)) {
    const rows = normalizeRows(readSheet(inputFile), inputFile);

    assertUniqueIds(rows, inputFile);

    data[key] = rows;
}

assertContinuousIds(data.verbsBase, 500, "verbs_base.xlsx");
assertContinuousIds(data.adjectivesBase, 500, "adjectives_base.xlsx");
assertContinuousIds(data.adverbsBase, 300, "adverbs_base.xlsx");

if (data.verbsPresent.length !== 500) {
    throw new Error("verbs_present.xlsx: expected 500 rows");
}
if (data.verbsPast.length !== 500) {
    throw new Error("verbs_past.xlsx: expected 500 rows");
}
if (data.verbsFutureImperative.length !== 500) {
    throw new Error("verbs_future_imperative.xlsx: expected 500 rows");
}
if (data.verbsExamples.length !== 500) {
    throw new Error("verbs_examples.xlsx: expected 500 rows");
}
if (data.adjectivesConstructions.length !== 88) {
    throw new Error("adjectives_constructions.xlsx: expected 88 rows");
}
if (data.adjectivesExamples.length !== 500) {
    throw new Error("adjectives_examples.xlsx: expected 500 rows");
}
if (data.adverbsUsage.length !== 300) {
    throw new Error("adverbs_usage.xlsx: expected 300 rows");
}
if (data.adverbsRelations.length !== 56) {
    throw new Error("adverbs_relations.xlsx: expected 56 rows");
}
if (data.adverbsExamples.length !== 300) {
    throw new Error("adverbs_examples.xlsx: expected 300 rows");
}

const verbsBase = makeIndex(data.verbsBase);

for (const [key, fileName] of [
    ["verbsPresent", "verbs_present.xlsx"],
    ["verbsPast", "verbs_past.xlsx"],
    ["verbsFutureImperative", "verbs_future_imperative.xlsx"],
    ["verbsExamples", "verbs_examples.xlsx"],
]) {
    assertWordMatches({
        rows: data[key],
        baseIndex: verbsBase,
        sourceField: "infinitive",
        baseField: "infinitive",
        fileName,
    });
}

const adjectivesBase = makeIndex(data.adjectivesBase);

assertWordMatches({
    rows: data.adjectivesConstructions,
    baseIndex: adjectivesBase,
    sourceField: "adjective",
    baseField: "masculine_singular",
    fileName: "adjectives_constructions.xlsx",
});

assertWordMatches({
    rows: data.adjectivesExamples,
    baseIndex: adjectivesBase,
    sourceField: "adjective",
    baseField: "masculine_singular",
    fileName: "adjectives_examples.xlsx",
});

const adverbsBase = makeIndex(data.adverbsBase);

for (const [key, fileName] of [
    ["adverbsUsage", "adverbs_usage.xlsx"],
    ["adverbsRelations", "adverbs_relations.xlsx"],
    ["adverbsExamples", "adverbs_examples.xlsx"],
]) {
    assertWordMatches({
        rows: data[key],
        baseIndex: adverbsBase,
        sourceField: "adverb",
        baseField: "adverb",
        fileName,
    });
}

for (const [key, [, outputFile]] of Object.entries(files)) {
    writeJson(outputFile, data[key]);
}

console.log("Grammar data converted successfully.");
console.log("Verbs:       500");
console.log("Adjectives:  500");
console.log("Adverbs:     300");
