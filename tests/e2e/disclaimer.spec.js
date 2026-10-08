// Стартовый дисклеймер о светочувствительности и офисный режим без вспышек
const { test, expect, SITE } = require("./fixtures");

test("обе кнопки видны без прокрутки, клик по тексту не запускает вспышки", async ({ page }) => {
  await page.goto(SITE);
  for (const id of ["#go", "#calm"]) await expect(page.locator(id)).toBeInViewport({ ratio: 1 });
  await expect(page.locator("#osCalm")).toBeHidden();
  await page.click("#start .by", { force: true });
  await expect(page.locator("#start")).toHaveCount(1);
});

test("офисный режим: ни одной CSS-анимации и никакой тряски", async ({ page }) => {
  await page.goto(SITE);
  await page.click("#calm", { force: true });
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => document.body.classList.contains("calm"))).toBe(true);
  const moving = await page.evaluate(() => [document.body, ...document.body.querySelectorAll("*")]
    .filter(e => getComputedStyle(e).animationName !== "none").map(e => e.tagName + "." + e.className));
  expect(moving, "в офисном режиме что-то шевелится").toEqual([]);
  await page.mouse.click(200, 200);
  expect(await page.evaluate(() => document.body.classList.contains("shake"))).toBe(false);
});

test("prefers-reduced-motion: дисклеймер советует офисный режим", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(SITE);
  await expect(page.locator("#osCalm")).toBeVisible();
  await expect(page.locator("#calm")).toBeFocused();
});
