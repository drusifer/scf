module.exports = [
    {
        files: ["viz_sizing.js", "tests/**/*.js"],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: "commonjs"
        },
        rules: {
            "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
        }
    },
    {
        files: ["index.inline.js"],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: "script",
            globals: {
                Papa: "readonly",
                SCFDataProcessor: "readonly",
                SCFSizing: "readonly",
                Treeselect: "readonly",
                alert: "readonly",
                console: "readonly",
                d3: "readonly",
                document: "readonly",
                localStorage: "readonly",
                setTimeout: "readonly",
                tailwind: "readonly",
                window: "readonly"
            }
        },
        rules: {
            "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
        }
    }
];
