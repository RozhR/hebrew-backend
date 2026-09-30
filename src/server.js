import http from "node:http";

const PORT = 3000;

const words = [
    {
        id: 1,
        hebrew: "ללמוד",
        translation: "учить",
        category: "verbs",
    },
    {
        id: 2,
        hebrew: "לעבוד",
        translation: "работать",
        category: "verbs",
    },
    {
        id: 3,
        hebrew: "גדול",
        translation: "большой",
        category: "adjectives",
    },
];

const server = http.createServer((request, response) => {
    response.setHeader("Content-Type", "application/json");

    const url = new URL(
        request.url,
        `http://${request.headers.host}`,
    );

    const pathname = url.pathname;

    // GET /api/health
    if (
        pathname === "/api/health" &&
        request.method === "GET"
    ) {
        response.statusCode = 200;

        response.end(
            JSON.stringify({
                status: "ok",
                message: "Hebrew Learning API is running",
            }),
        );

        return;
    }

    // GET /api/words
    if (
        pathname === "/api/words" &&
        request.method === "GET"
    ) {
        response.statusCode = 200;

        response.end(
            JSON.stringify({
                count: words.length,
                data: words,
            }),
        );

        return;
    }

    // POST /api/words
    if (
        pathname === "/api/words" &&
        request.method === "POST"
    ) {
        let body = "";

        request.on("data", (chunk) => {
            body += chunk;
        });

        request.on("end", () => {
            try {
                const data = JSON.parse(body);

                if (
                    !data.hebrew ||
                    !data.translation ||
                    !data.category
                ) {
                    response.statusCode = 400;

                    response.end(
                        JSON.stringify({
                            message: "Missing required fields",
                        }),
                    );

                    return;
                }

                const newWord = {
                    id: words.length + 1,
                    hebrew: data.hebrew,
                    translation: data.translation,
                    category: data.category,
                };

                words.push(newWord);

                response.statusCode = 201;

                response.end(
                    JSON.stringify({
                        message: "Word created",
                        data: newWord,
                    }),
                );
            } catch {
                response.statusCode = 400;

                response.end(
                    JSON.stringify({
                        message: "Invalid JSON",
                    }),
                );
            }
        });

        return;
    }

    // PUT /api/words/:id
    if (
        pathname.startsWith("/api/words/") &&
        request.method === "PUT"
    ) {
        const id = Number(
            pathname.split("/").at(-1),
        );

        const word = words.find(
            (item) => item.id === id,
        );

        if (!word) {
            response.statusCode = 404;

            response.end(
                JSON.stringify({
                    message: "Word not found",
                }),
            );

            return;
        }

        let body = "";

        request.on("data", (chunk) => {
            body += chunk;
        });

        request.on("end", () => {
            try {
                const data = JSON.parse(body);

                if (
                    !data.hebrew ||
                    !data.translation ||
                    !data.category
                ) {
                    response.statusCode = 400;

                    response.end(
                        JSON.stringify({
                            message: "Missing required fields",
                        }),
                    );

                    return;
                }

                word.hebrew = data.hebrew;
                word.translation = data.translation;
                word.category = data.category;

                response.statusCode = 200;

                response.end(
                    JSON.stringify({
                        message: "Word updated",
                        data: word,
                    }),
                );
            } catch {
                response.statusCode = 400;

                response.end(
                    JSON.stringify({
                        message: "Invalid JSON",
                    }),
                );
            }
        });

        return;
    }

    // DELETE /api/words/:id
    if (
        pathname.startsWith("/api/words/") &&
        request.method === "DELETE"
    ) {
        const id = Number(
            pathname.split("/").at(-1),
        );

        const wordIndex = words.findIndex(
            (item) => item.id === id,
        );

        if (wordIndex === -1) {
            response.statusCode = 404;

            response.end(
                JSON.stringify({
                    message: "Word not found",
                }),
            );

            return;
        }

        const deletedWord = words.splice(
            wordIndex,
            1,
        )[0];

        response.statusCode = 200;

        response.end(
            JSON.stringify({
                message: "Word deleted",
                data: deletedWord,
            }),
        );

        return;
    }

    // GET /api/words/:id
    if (
        pathname.startsWith("/api/words/") &&
        request.method === "GET"
    ) {
        const id = Number(
            pathname.split("/").at(-1),
        );

        const word = words.find(
            (item) => item.id === id,
        );

        if (!word) {
            response.statusCode = 404;

            response.end(
                JSON.stringify({
                    message: "Word not found",
                }),
            );

            return;
        }

        response.statusCode = 200;

        response.end(
            JSON.stringify({
                data: word,
            }),
        );

        return;
    }

    // Known route, but wrong method
    if (
        pathname === "/api/health" ||
        pathname === "/api/words" ||
        pathname.startsWith("/api/words/")
    ) {
        response.statusCode = 405;

        response.end(
            JSON.stringify({
                message: "Method not allowed",
            }),
        );

        return;
    }

    // Unknown route
    response.statusCode = 404;

    response.end(
        JSON.stringify({
            message: "Route not found",
        }),
    );
});

server.listen(PORT, () => {
    console.log(
        `Server is running on http://localhost:${PORT}`,
    );
});