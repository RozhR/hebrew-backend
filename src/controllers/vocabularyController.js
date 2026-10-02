import pool from "../db.js";

function parseLevel(value) {
    if (value === undefined) {
        return null;
    }

    const level = Number(value);

    return Number.isInteger(level) ? level : NaN;
}

async function getItems(request, response, table, maxLevel) {
    try {
        const level = parseLevel(request.query.level);

        if (Number.isNaN(level) || (level !== null && (level < 1 || level > maxLevel))) {
            return response.status(400).json({
                message: "Invalid level",
            });
        }

        const result =
            level === null
                ? await pool.query(
                      `
                        SELECT id, hebrew, translation, level
                        FROM ${table}
                        ORDER BY id
                    `,
                  )
                : await pool.query(
                      `
                        SELECT id, hebrew, translation, level
                        FROM ${table}
                        WHERE level = $1
                        ORDER BY id
                    `,
                      [level],
                  );

        response.status(200).json({
            count: result.rows.length,
            data: result.rows,
        });
    } catch (error) {
        response.status(500).json({
            message: "Database error",
            error: error.message,
        });
    }
}

async function getItemById(request, response, table, itemName) {
    try {
        const id = Number(request.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return response.status(400).json({
                message: "Invalid id",
            });
        }

        const result = await pool.query(
            `
                SELECT id, hebrew, translation, level
                FROM ${table}
                WHERE id = $1
            `,
            [id],
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: `${itemName} not found`,
            });
        }

        response.status(200).json({
            data: result.rows[0],
        });
    } catch (error) {
        response.status(500).json({
            message: "Database error",
            error: error.message,
        });
    }
}

export function getVerbs(request, response) {
    return getItems(request, response, "content.verbs", 25);
}

export function getVerbById(request, response) {
    return getItemById(request, response, "content.verbs", "Verb");
}

export function getAdjectives(request, response) {
    return getItems(request, response, "content.adjectives", 25);
}

export function getAdjectiveById(request, response) {
    return getItemById(request, response, "content.adjectives", "Adjective");
}

export function getAdverbs(request, response) {
    return getItems(request, response, "content.adverbs", 15);
}

export function getAdverbById(request, response) {
    return getItemById(request, response, "content.adverbs", "Adverb");
}
