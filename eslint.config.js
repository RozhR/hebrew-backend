import js from "@eslint/js";
import globals from "globals";

export default [
    {
        ignores: ["node_modules", "dist", "coverage"],
    },

    js.configs.recommended,

    {
        files: ["**/*.js", "**/*.mjs"],

        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",

            globals: {
                ...globals.node,
            },
        },
    },

    {
        files: ["tests/**/*.js"],

        languageOptions: {
            globals: {
                ...globals.jest,
            },
        },
    },
];
