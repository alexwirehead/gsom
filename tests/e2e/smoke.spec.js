// Smoke: платформа открывается на трёх экранах, кнопки жмутся, консоль чистая
const { test, expect, open } = require("./fixtures");

test("ЖМИ ЧТОБ ПЫЩЬ: старт и все кнопки управления", async ({ page }, testInfo) => {
  await open(page);
  await expect(page.locator("#start")).toHaveCount(0);
  await page.waitForTimeout(2500);
  for (const sel of ["#olb", "#beams", "#walk", "#gen", "#disco"]) await page.click(sel, { force: true });
  await page.waitForTimeout(1000);
  await expect(page.locator("#h1a")).toHaveText(/GSOM|ЖСОМЪ/);
  await expect(page.locator("#amp")).toBeVisible();
  await testInfo.attach(`glagne-${testInfo.project.name}`, { body: await page.screenshot(), contentType: "image/png" });
});

test("ПОПЯЧЬСЯ: тряска не ставит перевёрнутый сайт на ноги", async ({ page }) => {
  await open(page);
  await page.evaluate(() => document.body.classList.add("popyach"));
  await page.locator("body").dispatchEvent("pointerdown", { clientX: 200, clientY: 300 });
  const t = await page.evaluate(() => ({ shake: document.body.classList.contains("shake"), m: getComputedStyle(document.body).transform }));
  expect(t.shake).toBe(true);
  expect(t.m, "во время тряски сайт должен остаться вверх ногами").toMatch(/matrix\(-?1, 0, 0, -1/);
});

test("летающие надписи на месте и с ненулевой шириной", async ({ page }) => {
  await open(page, null);
  const w = await page.$$eval(".fly", els => els.map(e => e.offsetWidth));
  expect(w.length).toBeGreaterThanOrEqual(12);
  expect(w.filter(x => x === 0)).toEqual([]);
});
