// Бубнилка: при первом открытии дисктоячки спрашиваем, нужен ли голос поверх музыки
const { test, expect, open, probeAudio, seekTrack } = require("./fixtures");

const askWin = page => page.locator(".win.voiceask");

test("дисктоячка спрашивает про бубнёж, попап не лезет на плеер", async ({ page }, testInfo) => {
  await open(page);
  await page.click("#disco", { force: true });
  await expect(askWin(page)).toBeVisible();
  await expect(askWin(page)).toContainText("без бубнения");
  await expect(askWin(page).locator(".bar")).toContainText("Бубнилка.exe");
  const overlap = await page.evaluate(() => {
    const a = document.getElementById("amp").getBoundingClientRect(), r = document.querySelector(".win.voiceask").getBoundingClientRect();
    return r.left < a.right && r.right > a.left && r.top < a.bottom && r.bottom > a.top;
  });
  expect(overlap, "попап закрыл плеер").toBe(false);
  // печати Онотоле, взрывы, вставки и другие окна не должны зашлёпывать вопрос
  const covered = await page.evaluate(() => {
    const r = document.querySelector(".win.voiceask").getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    return ["stamp", "boom", "interrupt", "win", "beam"].filter(cls => {
      const e = document.createElement("div"); e.className = cls;
      Object.assign(e.style, { position: "fixed", left: cx - 50 + "px", top: cy - 50 + "px", width: "100px", height: "100px", animation: "none", opacity: "1" });
      document.body.appendChild(e);
      const top = document.elementFromPoint(cx, cy); e.remove();
      return !top.closest(".win.voiceask");
    });
  });
  expect(covered, "что-то легло поверх Бубнилки").toEqual([]);
  await testInfo.attach(`bubnilka-${testInfo.project.name}`, { body: await page.screenshot(), contentType: "image/png" });
});

test("«ТОЛЬКО МУЗОН»: голос молчит, караоке остаётся, спрашиваем один раз", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desk", "голос от экрана не зависит");
  await probeAudio(page);
  await open(page);
  await page.click("#disco", { force: true });
  await askWin(page).getByRole("button", { name: /ТОЛЬКО МУЗОН/ }).click({ force: true });
  await expect(page.locator("#ampVoice")).toHaveText("🤐");
  await seekTrack(page, /РАГГА/);
  await page.evaluate(() => { window.__said = []; });
  await expect(page.locator("#ampLyric .on").first()).toBeAttached({ timeout: 8000 });
  await page.waitForTimeout(3500);
  expect(await page.evaluate(() => window.__said), "бубнёж просочился").toEqual([]);
  await page.click("#ampX", { force: true });
  await page.click("#disco", { force: true });
  await page.waitForTimeout(1300);
  await expect(askWin(page)).toHaveCount(0);
});

test("«пусть бубнит» и кнопка 🗣️ в плеере возвращает голос", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desk", "голос от экрана не зависит");
  await probeAudio(page);
  await open(page);
  await page.click("#disco", { force: true });
  await askWin(page).getByRole("button", { name: /пусть бубнит/ }).click({ force: true });
  await expect(page.locator("#ampVoice")).toHaveText("🗣️");
  await page.click("#ampVoice", { force: true });
  await expect(page.locator("#ampVoice")).toHaveText("🤐");
  await page.click("#ampVoice", { force: true });
  await seekTrack(page, /РАГГА/);
  await expect.poll(() => page.evaluate(() => window.__said.length), { timeout: 8000 }).toBeGreaterThan(0);
});
