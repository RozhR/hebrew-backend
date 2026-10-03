# Hebrew Learning Backend

Backend API for the Hebrew Learning application.

The backend is built with Node.js, Express and PostgreSQL.

It provides vocabulary and grammar data to the React frontend and contains a complete content pipeline for converting Excel source files into PostgreSQL data.

## Tech Stack

- Node.js
- Express
- PostgreSQL
- pg
- dotenv
- XLSX
- ESLint
- Prettier

## Architecture

```text
Excel source files
        ↓
convert-grammar-data.mjs
        ↓
JSON seed data
        ↓
PostgreSQL
        ↓
Express REST API
        ↓
React frontend
```
