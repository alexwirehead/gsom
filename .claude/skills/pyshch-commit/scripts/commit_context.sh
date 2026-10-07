#!/usr/bin/env bash
# Собирает контекст для пыщь-коммита. Только читает, ничего не меняет.
set -u
MAX_DIFF_LINES="${MAX_DIFF_LINES:-400}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ОШИБКА: это не git-репозиторий. Попячтсо."; exit 1
fi
ROOT="$(git rev-parse --show-toplevel)"

echo "=== ВЕТКА ==="
git branch --show-current 2>/dev/null || git rev-parse --short HEAD

echo; echo "=== СТАТУС ==="
git status --short

echo; echo "=== ЗАСТЕЙДЖЕНО (stat) ==="
if git diff --staged --quiet; then
  echo "(ничего не застейджено — спроси пользователя, что включить в коммит)"
else
  git diff --staged --stat
  echo; echo "=== ЗАСТЕЙДЖЕНО (diff, первые ${MAX_DIFF_LINES} строк) ==="
  git diff --staged --no-color | head -n "$MAX_DIFF_LINES"
  TOTAL=$(git diff --staged --no-color | wc -l)
  [ "$TOTAL" -gt "$MAX_DIFF_LINES" ] && echo "... дифф обрезан: всего $TOTAL строк. Смотри файлы точечно через git diff --staged -- <файл>"
fi

echo; echo "=== ПОСЛЕДНИЕ КОММИТЫ (стиль, язык, скоупы, уже использованные шутки) ==="
git log -n 15 --pretty=format:'%h %s' 2>/dev/null || echo "(коммитов ещё нет — это первыйнах!)"
echo

echo; echo "=== COMMITLINT ==="
found=0
for f in commitlint.config.js commitlint.config.cjs commitlint.config.mjs commitlint.config.ts .commitlintrc .commitlintrc.json .commitlintrc.yml .commitlintrc.yaml .commitlintrc.js; do
  if [ -f "$ROOT/$f" ]; then echo "найден: $f"; found=1; fi
done
if [ -f "$ROOT/package.json" ] && grep -q '"commitlint"' "$ROOT/package.json"; then echo "найден: секция commitlint в package.json"; found=1; fi
[ "$found" -eq 0 ] && echo "нет — действуют правила скилла (заголовок до 72 символов)"

echo; echo "=== НАСТРОЙКИ PYSHCH-COMMIT ==="
grep -HniE "pyshch-commit|funny.commit" "$ROOT/CLAUDE.md" "$ROOT/CONTRIBUTING.md" 2>/dev/null || echo "(не заданы — уровень абсурда 2)"
