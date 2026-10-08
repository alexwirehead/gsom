// Общий доступ к index.html для статических проверок: без браузера, только node
import { readFileSync } from "node:fs";

export const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
export const script = html.slice(html.indexOf("<script>"), html.lastIndexOf("</script>"));

// TRACKS вместе с хелперами — чистые данные, их можно вычислить без DOM
export function loadTracks() {
  const a = html.indexOf("  // хелперы партий"), b = html.indexOf("  ];\n", a) + 5;
  return new Function(html.slice(a, b) + "; return TRACKS;")();
}

// тело функции верхнего уровня IIFE: от «function name(» до первой строки «  }»
export function functionBodies() {
  const out = {};
  for (const m of script.matchAll(/^ {2}function (\w+)\([^)]*\) \{/gm)) {
    const start = m.index, end = script.indexOf("\n  }", start);
    const body = script.slice(start, end === -1 ? undefined : end);
    out[m[1]] = { first: body.slice(m[0].length).replace(/^\s*\/\/.*\n/, "").trim(), body };
  }
  return out;
}
