#!/usr/bin/env python3
"""Проверка пыщь-коммита перед показом пользователю.

python3 check_message.py <файл-с-сообщением> [--max 72]

Ошибки (exit 1): длинный заголовок, не Conventional Commits, нет пустой строки
после заголовка, фейковые трейлеры авторства, запрещённая лексика.
Предупреждения (exit 0): BREAKING CHANGE / «!» — убедись, что изменение реально ломающее.
"""
import re
import sys

TYPES = "feat|fix|perf|refactor|docs|test|style|chore|ci|build|revert"
HEADER = re.compile(rf"^({TYPES})(\([^)\s]+\))?(!)?: \S")
FAKE_TRAILERS = re.compile(r"^(Co-authored-by|Signed-off-by|Reviewed-by|Acked-by|Tested-by):", re.I | re.M)
# мат и туалетный юмор — скилл обещает семейную синергию
BANNED = [r"\bху[йяеёи]", r"пизд", r"\bбля", r"\bе[б]а[нтл]", r"\bёб", r"\bсук[аи]\b", r"говн",
          r"понос", r"\bжоп", r"перд", r"\bсрат", r"\bсрал", r"\bfuck", r"\bshit", r"\bcrap\b"]


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print(__doc__); return 2
    limit = 72
    if "--max" in args:
        i = args.index("--max"); limit = int(args[i + 1]); del args[i:i + 2]
    text = open(args[0], encoding="utf-8").read().rstrip("\n")
    lines = text.split("\n")
    subject = lines[0]
    errors, warnings = [], []

    if len(subject) > limit:
        errors.append(f"заголовок {len(subject)} символов > {limit}. Перенеси шутливый хвост в тело.")
    if not HEADER.match(subject):
        errors.append("заголовок не в формате Conventional Commits: type(scope): описание")
    if len(lines) > 1 and lines[1].strip():
        errors.append("после заголовка нужна пустая строка")
    if FAKE_TRAILERS.search(text):
        errors.append("найдены трейлеры авторства (Co-authored-by/Signed-off-by/Reviewed-by...). "
                      "Используй шуточные Onotole-Verdict:, Synergy: и т.п.")
    low = text.lower()
    for pat in BANNED:
        m = re.search(pat, low)
        if m:
            errors.append(f"запрещённая лексика: «{m.group(0)}…». Пыщь-коммиты без мата и туалетного юмора.")
    if re.search(r"^BREAKING[ -]CHANGE:", text, re.M) or HEADER.match(subject) and HEADER.match(subject).group(3):
        warnings.append("BREAKING CHANGE / «!»: semantic-release поднимет мажорную версию. "
                        "Если это шутка — замени на трейлер Cosmic-Change:.")

    for w in warnings:
        print(f"⚠️  {w}")
    for e in errors:
        print(f"❌ {e}")
    if errors:
        print("Онотоле негодуе. Поправь и проверь снова."); return 1
    print(f"✅ Онотоле одобряе (заголовок {len(subject)}/{limit})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
