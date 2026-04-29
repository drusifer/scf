import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./tests/e2e",
    timeout: 30000,
    retries: 0,
    use: {
        baseURL: "http://localhost:8001",
        screenshot: "only-on-failure",
        video: "off",
        headless: true,
        viewport: { width: 1440, height: 900 },
    },
    webServer: {
        command: "python3 -m http.server 8001",
        port: 8001,
        reuseExistingServer: !process.env.CI,
        timeout: 10000,
    },
    outputDir: "tests/e2e/results",
    reporter: [["list"], ["html", { outputFolder: "tests/e2e/report", open: "never" }]],
});
