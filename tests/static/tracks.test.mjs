// Линтер УПЧК-ампа: такты, ноты, форма и длительность. Мелодии проверяет Онотоле лично.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadTracks } from "./_site.mjs";

const TRACKS = loadTracks();
const PARTS = ["melody", "bass", "chords", "drums", "fx"];
const NOTE = /^[A-G]#?\d$/;
const toks = s => s.split(/\s+/).filter(x => x && x !== "|");
const sectionsOf = tr => tr.sections || { "плоский": tr };

test("в плеере есть треки, бонус — последним, имена не повторяются", () => {
  assert.ok(TRACKS.length >= 4, `треков ${TRACKS.length}, а стопицот не завезли`);
  assert.match(TRACKS.at(-1).name, /БОНУС/, "бонусный трек должен быть последним");
  assert.equal(new Set(TRACKS.map(t => t.name)).size, TRACKS.length, "два трека с одним именем — это не ремикс");
});

for (const tr of TRACKS) {
  const bar = tr.bar || 16;
  test(`${tr.name}: партии ровно по тактам и из допустимых токенов`, () => {
    for (const [sk, sec] of Object.entries(sectionsOf(tr))) for (const k of PARTS) {
      if (!sec[k]) continue;
      const where = `${sk}.${k}`, list = toks(sec[k]);
      assert.equal(list.length % bar, 0, `${where}: ${list.length} шагов не кратно такту ${bar}`);
      for (const [j, g] of sec[k].split("|").entries())
        assert.equal(toks(g).length % bar, 0, `${where}, группа тактов ${j + 1} неполная`);
      assert.notEqual(list[0], "-", `${where}: партия не может начинаться с «-»`);
      for (const t of list) {
        if (k === "drums") assert.match(t, /^[KSho.]+$/, `${where}: барабан «${t}»`);
        else if (k === "fx") assert.match(t, /^[puz.]+$/, `${where}: эффект «${t}»`);
        else if (t !== "." && t !== "-") t.split("+").forEach(n => assert.match(n, NOTE, `${where}: нота «${n}»`));
      }
    }
  });

  test(`${tr.name}: форма ссылается на существующие секции, трек длится 1–3 минуты`, () => {
    let steps = 0;
    if (tr.form) {
      for (const f of tr.form.trim().split(/\s+/)) {
        const m = /^([A-Z])(_?)([+-]\d+)?$/.exec(f);
        assert.ok(m, `форма: непонятный токен «${f}»`);
        const sec = tr.sections[m[1]];
        assert.ok(sec, `форма: секции «${m[1]}» нет`);
        steps += Math.max(...PARTS.map(k => (sec[k] ? toks(sec[k]).length : 0)));
      }
    } else steps = Math.max(...PARTS.map(k => (tr[k] ? toks(tr[k]).length : 0)));
    const sec = (steps * (tr.loops || (tr.form ? 1 : 2)) * 60) / tr.bpm / 4;
    assert.ok(sec >= 60 && sec <= 180, `${Math.round(sec)} с — хит должен идти от минуты до трёх`);
  });

  test(`${tr.name}: есть что спеть в караоке`, () => {
    assert.ok(Array.isArray(tr.say) && tr.say.length > 0, "say пустой — Онотоле нечего одобрять");
  });
}
