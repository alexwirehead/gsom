"""Smoke-тест GSOM EE: открывает платформу на трёх экранах, жмёт кнопки, проверяет консоль.

pip install playwright && playwright install chromium
python3 tests/smoke.py
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
URL = (ROOT / "index.html").as_uri()
OUT = Path(__file__).resolve().parent
VIEWPORTS = {"desk": (1440, 900), "phone": (390, 844), "land": (844, 390)}

failed = False
with sync_playwright() as p:
    browser = p.chromium.launch()
    for name, (w, h) in VIEWPORTS.items():
        page = browser.new_page(viewport={"width": w, "height": h})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(URL)
        # force=True: кнопки анимированы и никогда не становятся «stable»
        page.click("#start button", force=True)
        page.wait_for_timeout(2500)
        for sel in ["#olb", "#beams", "#walk", "#gen"]:
            page.click(sel, force=True)
        page.wait_for_timeout(1000)
        page.screenshot(path=str(OUT / f"{name}.png"))
        status = "✅ Онотоле одобряе" if not errors else f"❌ Онотоле негодуе: {errors}"
        print(f"{name:6} {status}")
        failed |= bool(errors)
    browser.close()

raise SystemExit(1 if failed else 0)
