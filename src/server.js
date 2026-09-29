import http from "node:http";

const PORT = 3000;

const server = http.createServer((request, response) => {
    if (request.url === "/api/health") {
        response.statusCode = 200;
        response.setHeader("Content-Type", "application/json");

        response.end(
            JSON.stringify({
                status: "ok",
                message: "Hebrew Learning API is running",
            }),
        );

        return;
    }

    response.statusCode = 404;
    response.setHeader("Content-Type", "application/json");

    response.end(
        JSON.stringify({
            message: "Route not found",
        }),
    );
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});