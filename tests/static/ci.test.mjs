// Онотоле CI сам под присмотром: GitHub flow держится на этих мелочах (CONTRIBUTING.md, «Ветки и коммиты»)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const ci = readFileSync(new URL("../../.github/workflows/ci.yml", import.meta.url), "utf8");

test("вердикт Онотоле на месте: на его имя завязана защита main", () => {
  assert.match(ci, /^\s+name: "⚖️ Вердикт Онотоле"$/m, "переименовали вердикт — поправьте и правило защиты ветки");
  assert.match(ci, /needs: \[static, e2e, commits\]/, "вердикт должен ждать все проверки");
  assert.match(ci, /if: always\(\)/, "вердикт обязан вынести приговор даже упавшим");
});

test("CI срабатывает на PR и на main, а пыщь-коммиты проверяются в PR", () => {
  assert.match(ci, /^\s+pull_request:/m);
  assert.match(ci, /push:\s*\n\s+branches: \[main\]/);
  assert.match(ci, /if: github\.event_name == 'pull_request'/);
});

test("сторонние actions прибиты к коммиту, а не к плавающему тегу", () => {
  const uses = [...ci.matchAll(/uses:\s*(\S+)/g)].map(m => m[1]);
  assert.ok(uses.length > 0);
  assert.deepEqual(uses.filter(u => !/@[0-9a-f]{40}$/.test(u)), [], "action без SHA");
});

test("прогоны main не отменяются, токен в чекауте не залёживается", () => {
  assert.doesNotMatch(ci, /cancel-in-progress: true/);
  const checkouts = ci.match(/actions\/checkout@/g).length;
  assert.equal(ci.match(/persist-credentials: false/g)?.length, checkouts);
});

test("у PR есть шаблон с чек-листом", () => {
  const tpl = new URL("../../.github/pull_request_template.md", import.meta.url);
  assert.ok(existsSync(tpl), "шаблон PR пропал");
  assert.match(readFileSync(tpl, "utf8"), /npm test/);
});
