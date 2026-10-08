// УПЧК-амп: плеер, все треки, шаффл и окна, которые не лезут на плеер
const { test, expect, open, probeAudio, seekTrack } = require("./fixtures");

test("дисктоячка: открыть, листать, пауза, закрыть", async ({ page }) => {
  await open(page);
  await page.click("#disco", { force: true });
  await expect(page.locator("#amp")).toBeVisible();
  await expect(page.locator("body")).toHaveClass(/disco/);
  const first = await page.textContent("#ampTitle");
  await page.click("#ampNext", { force: true });
  await expect(page.locator("#ampTitle")).not.toHaveText(first);
  await page.click("#ampPlay", { force: true });
  await expect(page.locator("#ampTitle")).toContainText("ПАУЗА");
  await expect(page.locator("body")).not.toHaveClass(/disco/);
  await page.click("#ampX", { force: true });
  await expect(page.locator("#amp")).toBeHidden();
});

test("каждый трек звучит", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desk", "звук от размера экрана не зависит — хватит одного прогона");
  await probeAudio(page);
  await open(page);
  await page.click("#disco", { force: true });
  await seekTrack(page, /^1\//);
  const total = +(await page.textContent("#ampTitle")).match(/^1\/(\d+)/)[1];
  for (let k = 1; k <= total; k++) {
    await expect(page.locator("#ampTitle")).toContainText(`${k}/${total}.`);
    await page.evaluate(() => { window.__src = 0; });
    await page.waitForTimeout(1500);
    const title = await page.textContent("#ampTitle");
    expect(await page.evaluate(() => window.__src), `тишина в треке ${title}`).toBeGreaterThan(0);
    await page.click("#ampNext", { force: true });
  }
});

test("шаффл никогда не повторяет текущий трек", async ({ page }) => {
  await open(page);
  await page.click("#disco", { force: true });
  await page.click("#ampShuf", { force: true });
  await expect(page.locator("#ampShuf")).toHaveClass(/on/);
  const num = async () => (await page.textContent("#ampTitle")).match(/^(\d+)\/(\d+)/).slice(1).map(Number);
  let [prev, total] = await num(); const seen = new Set([prev]); let inOrder = 0;
  for (let k = 0; k < 15; k++) {
    await page.click("#ampNext", { force: true });
    const [cur] = await num();
    expect(cur).not.toBe(prev);
    if (cur === (prev % total) + 1) inOrder++;
    seen.add(cur); prev = cur;
  }
  expect(seen.size).toBeGreaterThanOrEqual(4);
  expect(inOrder, "шаффл играет по порядку — это не шаффл, это плейлист").toBeLessThan(10);
});

test("новые окна не появляются поверх плеера и кнопок", async ({ page }) => {
  await open(page);
  await page.click("#disco", { force: true });
  await page.evaluate(() => document.querySelectorAll(".win:not(.amp)").forEach(w => w.remove()));
  for (let i = 0; i < 3; i++) await page.click("#gen", { force: true });
  const overlaps = await page.evaluate(() => {
    const keep = [document.getElementById("amp"), document.querySelector(".controls")].map(e => e.getBoundingClientRect());
    return [...document.querySelectorAll(".win:not(.amp)")].filter(w => {
      const r = w.getBoundingClientRect();
      return keep.some(a => r.left < a.right && r.right > a.left && r.top < a.bottom && r.bottom > a.top);
    }).length;
  });
  expect(overlaps).toBe(0);
});

test("проигнорированное окно зависает, а потом уходит со спецэффектом", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desk", "таймеры одинаковые на всех экранах");
  await open(page);
  await page.evaluate(() => document.querySelectorAll(".win:not(.amp)").forEach(w => w.remove()));
  await page.click("#gen", { force: true });
  const win = page.locator(".win:not(.amp)").first();
  await expect(win).toHaveClass(/hung/, { timeout: 9000 });
  await expect(win.locator(".bar")).toContainText("Не отвечает");
  await expect(page.locator(".win[data-exit]").first()).toBeAttached({ timeout: 7000 });
});
