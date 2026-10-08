// На iOS речь приглушает музыку, поэтому фразы трека поются 8-битными слогами; на десктопе — голосом
const { test, expect, open, probeAudio, seekTrack } = require("./fixtures");
const { devices } = require("@playwright/test");

async function listenRagga(page) {
  await probeAudio(page);
  await open(page);
  await page.click("#disco", { force: true });
  await seekTrack(page, /РАГГА/); // say каждый такт — фраза придёт быстрее всего
  await expect(page.locator("#ampLyric .on").first()).toBeAttached({ timeout: 8000 });
  // первая фраза планируется прямо при переключении трека, поэтому счётчики обнуляем после неё и ждём следующую
  await page.evaluate(() => { window.__said = []; window.__bp = 0; });
}

test.describe("айфон", () => {
  test.use({ userAgent: devices["iPhone 13"].userAgent });
  test("фразы поются бипами, синтез речи молчит, караоке подсвечивает слоги", async ({ page }) => {
    await listenRagga(page);
    await expect.poll(() => page.evaluate(() => window.__bp), { message: "слоги идут через bandpass-форманты", timeout: 8000 }).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.__said), "на iOS speechSynthesis глушит музыку").toEqual([]);
  });
});

test("десктоп: фразы трека говорит голос, караоке тоже есть", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desk", "это про десктоп");
  await listenRagga(page);
  await expect.poll(() => page.evaluate(() => window.__said.length), { timeout: 8000 }).toBeGreaterThan(0);
});
