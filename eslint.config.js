module.exports = [
    {
        files: ["viz_sizing.js", "reading_mode.js", "framework_configs.js", "framework_processor.js", "tests/**/*.js"],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: "commonjs",
            globals: {
                Papa: "readonly",
                module: "writable",
                require: "readonly"
            }
        },
        rules: {
            "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
        }
    },
    {
        files: ["app.js"],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: "script",
            globals: {
                Papa: "readonly",
                FrameworkDataProcessor: "readonly",
                FRAMEWORK_CONFIGS: "readonly",
                SCFReadingMode: "readonly",
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
