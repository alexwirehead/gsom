// Инварианты в живом хаосе: ни одного сетевого запроса и лимиты DOM из SPEC §9
const { test, expect, open, isMobile } = require("./fixtures");

test("хаос с потолком: 12 секунд кликов не пробивают лимиты и не ходят в сеть", async ({ page }, testInfo) => {
  test.setTimeout(45_000);
  const external = [];
  page.on("request", r => { if (!/^(file|data|blob):/.test(r.url())) external.push(r.url()); });
  await open(page);
  await page.click("#disco", { force: true });
  const { width, height } = testInfo.project.use.viewport;
  for (let i = 0; i < 40; i++) {
    await page.mouse.click(20 + ((i * 97) % (width - 40)), 60 + ((i * 53) % (height - 120)));
    if (i % 5 === 0) await page.click("#gen", { force: true });
    await page.waitForTimeout(300);
  }
  const mobile = isMobile(testInfo) && width <= 700;
  const n = await page.evaluate(() => ({
    wins: document.querySelectorAll(".win:not(.amp)").length,
    stamps: document.querySelectorAll(".stamp").length,
    interrupts: document.querySelectorAll(".interrupt").length,
    flyers: document.querySelectorAll(".fly").length,
    ufos: document.querySelectorAll(".ufofly").length,
    log: document.getElementById("log").children.length,
    comments: document.getElementById("comments").children.length,
  }));
  expect(external, "запросы мимо file://").toEqual([]);
  expect(n.wins).toBeLessThanOrEqual(mobile ? 3 : 7);
  expect(n.stamps).toBeLessThanOrEqual(1);
  expect(n.interrupts).toBeLessThanOrEqual(1);
  expect(n.flyers).toBeLessThanOrEqual(mobile ? 40 : 70);
  expect(n.ufos).toBeLessThanOrEqual(1);
  expect(n.log).toBeLessThanOrEqual(30);
  expect(n.comments).toBeLessThanOrEqual(14);
});
