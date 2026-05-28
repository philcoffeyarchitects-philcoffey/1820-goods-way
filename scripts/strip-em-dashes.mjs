// Strip em-dashes (U+2014) from deck source files and replace with
// context-appropriate punctuation. En-dashes (U+2013) used for numeric
// ranges like "380–490" are left alone.
//
// Replacement rules (in order):
//   " — " followed by uppercase letter (incl. "I ")  →  ". "   (sentence break)
//   " — " followed by anything else                  →  ", "   (aside)
//   " —\n" or " —$"  (em-dash at end of line/string) →  ","
//   "— " at start of line                            →  ""
//   "—" left over (no spaces, inline)                →  ", "
//
// Run with:  node scripts/strip-em-dashes.mjs
import fs from "node:fs";
import path from "node:path";

const FILES = [
  "src/pages.jsx",
  "src/app.jsx",
  "src/footprint.jsx",
  "src/calculator.jsx",
  "src/placeholder.jsx",
  "src/lock.jsx",
  "src/main.jsx",
  "src/tweaks-panel.jsx",
];

let totalSwapped = 0;
for (const rel of FILES) {
  const file = path.resolve(rel);
  if (!fs.existsSync(file)) continue;
  let src = fs.readFileSync(file, "utf8");
  const before = (src.match(/—/g) || []).length;
  if (!before) { console.log(`${rel}: no em-dashes`); continue; }

  // 1) " — " followed by uppercase letter → ". "   (sentence break)
  src = src.replace(/ — (?=[A-Z])/g, ". ");
  // 2) " — " (any other case) → ", "
  src = src.replace(/ — /g, ", ");
  // 3) " —" at end of line / before newline → ","
  src = src.replace(/ —(?=\s*\n)/g, ",");
  // 4) "— " at start of line → "" (drop)
  src = src.replace(/(^|\n)— /g, "$1");
  // 5) any remaining "—" (no surrounding spaces) → ", "
  src = src.replace(/—/g, ", ");

  const after = (src.match(/—/g) || []).length;
  fs.writeFileSync(file, src);
  const swapped = before - after;
  totalSwapped += swapped;
  console.log(`${rel}: ${before} → ${after}   (swapped ${swapped})`);
}
console.log(`\nTotal em-dashes removed: ${totalSwapped}`);
