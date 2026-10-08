// Совет Онотоле проверяет платформу на трёх экранах из CLAUDE.md.
// CommonJS, а не ESM: загрузчик ESM в Playwright 1.48 зависает на Node 24.
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"], ["html", { open: "never" }]] : "list",
  use: {
    launchOptions: { args: ["--autoplay-policy=no-user-gesture-required"] },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desk", use: { viewport: { width: 1440, height: 900 } } },
    { name: "phone", use: { viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: "land", use: { viewport: { width: 844, height: 390 }, hasTouch: true } },
  ],
});
