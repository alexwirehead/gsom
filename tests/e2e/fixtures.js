// Общая обвязка e2e: страница, ловля ошибок консоли и «прослушка» Web Audio
const { test: base, expect } = require("@playwright/test");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

const SITE = pathToFileURL(path.join(__dirname, "../../index.html")).href;

const test = base.extend({
  // любая ошибка в консоли валит тест: Онотоле негодуе
  pageErrors: [async ({ page }, use) => {
    const errors = [];
    page.on("pageerror", e => errors.push(String(e)));
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    await use(errors);
    expect(errors, "ошибки в консоли").toEqual([]);
  }, { auto: true }],
});

// Считает источники звука (осцилляторы + буферы), фильтры и фразы речи; ctx доступен как window.__ctx.
// ios: true — делает вид, что есть navigator.audioSession (Safari 16.4+).
async function probeAudio(page, { ios = false } = {}) {
  await page.addInitScript(isIOS => {
    window.__src = 0; window.__bp = 0; window.__said = [];
    speechSynthesis.speak = u => { window.__said.push(u.text); };
    if (isIOS) navigator.audioSession = { type: "auto" };
    const AC = window.AudioContext;
    window.AudioContext = class extends AC {
      constructor(...a) {
        super(...a); window.__ctx = this;
        const co = this.createOscillator.bind(this), cb = this.createBufferSource.bind(this), cf = this.createBiquadFilter.bind(this);
        this.createOscillator = () => { window.__src++; return co(); };
        this.createBufferSource = () => { window.__src++; return cb(); };
        this.createBiquadFilter = () => { window.__bp++; return cf(); };
      }
    };
  }, ios);
}

// Открыть платформу и нажать кнопку на стартовом дисклеймере (go | calm), если надо
async function open(page, start = "go") {
  await page.goto(SITE);
  if (start) await page.click(`#${start}`, { force: true }); // force: под кнопкой анимированный фон
}

// Листать плеер, пока заголовок не совпадёт
async function seekTrack(page, re) {
  for (let k = 0; k < 20; k++) {
    if (re.test(await page.textContent("#ampTitle"))) return;
    await page.click("#ampNext", { force: true });
  }
  throw new Error(`трек ${re} не найден`);
}

const isMobile = testInfo => testInfo.project.name !== "desk";

module.exports = { SITE, test, expect, probeAudio, open, seekTrack, isMobile };
