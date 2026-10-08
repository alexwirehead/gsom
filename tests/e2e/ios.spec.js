// iOS-нюансы звука (SPEC §6.12): Playwright не повторяет аудиостек айфона, поэтому моделируем засыпание контекста
const { test, expect, open, probeAudio } = require("./fixtures");

test.beforeEach(async ({ page }) => { await probeAudio(page, { ios: true }); });

test("audioSession переключается в playback, чтобы беззвучка не глушила музыку", async ({ page }) => {
  await open(page);
  expect(await page.evaluate(() => navigator.audioSession.type)).toBe("playback");
});

test("уснувший контекст: дисктоячка будит его и играет", async ({ page }) => {
  await open(page);
  await page.evaluate(() => window.__ctx.suspend());
  await page.click("#disco", { force: true });
  await expect.poll(() => page.evaluate(() => window.__ctx.state)).toBe("running");
  await expect(page.locator("#ampTitle")).toContainText("ИГРАЕТ");
  const r = await page.evaluate(async () => {
    const t = window.__ctx.currentTime, s = window.__src;
    await new Promise(ok => setTimeout(ok, 1200));
    return { adv: window.__ctx.currentTime - t, src: window.__src - s };
  });
  expect(r.adv).toBeGreaterThan(0.5);
  expect(r.src).toBeGreaterThan(0);
});

test("уснул посреди трека: «ТЫКНИ ▶», тап доигрывает", async ({ page }, testInfo) => {
  await open(page);
  await page.click("#disco", { force: true });
  await expect(page.locator("#ampTitle")).toContainText("ИГРАЕТ");
  await page.evaluate(() => window.__ctx.suspend());
  await expect(page.locator("#ampTitle")).toContainText("ТЫКНИ");
  await expect(page.locator("body")).not.toHaveClass(/disco/);
  const { width, height } = testInfo.project.use.viewport;
  await page.mouse.click(width / 2, height / 2);
  await expect(page.locator("#ampTitle")).toContainText("ИГРАЕТ");
  await expect(page.locator("body")).toHaveClass(/disco/);
});

test("mute глушит плеер и не включает его обратно сам", async ({ page }) => {
  await open(page);
  await page.click("#disco", { force: true });
  await page.click("#mute", { force: true });
  await expect(page.locator("body")).not.toHaveClass(/disco/);
  await page.click("#mute", { force: true });
  await page.waitForTimeout(300);
  await expect(page.locator("body")).not.toHaveClass(/disco/);
});
