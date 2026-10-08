// Инварианты из CLAUDE.md и SPEC §1: то, что ломать нельзя ни при какой синергии
import { test } from "node:test";
import assert from "node:assert/strict";
import { html, script, functionBodies } from "./_site.mjs";

test("один файл: никаких внешних скриптов, стилей и сетевых запросов", () => {
  const urls = [...html.matchAll(/https?:\/\/[^\s"')]+/g)].map(m => m[0]);
  assert.deepEqual(urls.filter(u => !u.startsWith("http://www.w3.org/")), [], "внешние адреса в index.html");
  for (const bad of [/<script[^>]+src=/i, /<link[^>]+stylesheet/i, /@import/, /\bfetch\(/, /XMLHttpRequest/, /new WebSocket/, /\bimport\(/])
    assert.doesNotMatch(html, bad, `найдено ${bad}`);
});

test("каждая функция, которая создаёт звук, начинается с if (!live()) return;", () => {
  const SKIP = new Set(["unlockAudio", "noise"]); // создаёт сам контекст / общий буфер шума
  const offenders = Object.entries(functionBodies())
    .filter(([name, f]) => !SKIP.has(name) && /ctx\.create/.test(f.body) && !f.first.startsWith("if (!live()) return;"))
    .map(([name]) => name);
  assert.deepEqual(offenders, [], "звук без проверки live()");
});

test("вспышки не чаще, чем согласовано в SPEC §10.9 (blink не быстрее .2s)", () => {
  const durs = [...html.matchAll(/\bblink\s+([\d.]+)s/g)].map(m => +m[1]);
  assert.ok(durs.length > 0, "мигание пропало? тогда и тест можно попячить");
  assert.deepEqual(durs.filter(d => d < 0.2), [], "слишком быстрое мигание");
});

test("офисный режим: каждая JS-анимация проверяет body.calm", () => {
  const lines = script.split("\n").filter(l => /\.animate\(/.test(l));
  assert.deepEqual(lines.filter(l => !/calm/.test(l)).map(l => l.trim()), [], "element.animate() без проверки calm");
  assert.match(html, /body\.calm, body\.calm \*/, "CSS офисного режима пропал");
});

test("стартовый дисклеймер на месте и серьёзный блок без шуток", () => {
  const serious = html.match(/<div class="serious">([\s\S]*?)<\/div>/);
  assert.ok(serious, "нет блока .serious");
  assert.match(serious[1], /эпилептическ/, "в серьёзном блоке нет предупреждения о припадках");
  assert.match(serious[1], /закройте вкладку/, "нет совета закрыть вкладку");
  assert.doesNotMatch(serious[1], /онотоле|пыщ|попяч|!!!11/i, "шутки внутри серьёзного блока");
  for (const id of ["go", "calm"]) assert.match(html, new RegExp(`id="${id}"`), `нет кнопки #${id}`);
});

test("лор: без запрещённых мемов из SPEC §11", () => {
  for (const bad of [/выпей\s+йаду/i, /убейся\s+апстену/i, /онотоле\s+сказал/i])
    assert.doesNotMatch(html, bad, `в лоре ${bad}`);
});
