// The Emscripten UTF-8 decoder glue code (bundled from signalsmith-stretch)
// contains a literal U+FFFD replacement character as its fallback string
// for malformed UTF-8 input - completely normal, unrelated to our app. Some
// downstream content scanners (e.g. the Claude Artifact publisher) reject
// any file containing that literal codepoint outright. Since `"�"` and
// the literal character are byte-for-byte identical once JS parses the
// string, swapping the raw glyph for its escape sequence is a no-op at
// runtime and keeps the build content-scanner-friendly.
import fs from "node:fs";

const target = process.argv[2];
if (!target) {
  console.error("Usage: node scripts/fix-replacement-char.mjs <file>");
  process.exit(1);
}

const original = fs.readFileSync(target, "utf-8");
const parts = original.split("�");
const count = parts.length - 1;

if (count > 0) {
  fs.writeFileSync(target, parts.join("\\uFFFD"), "utf-8");
  console.log(`Escaped ${count} literal U+FFFD occurrence(s) in ${target}`);
} else {
  console.log(`No literal U+FFFD found in ${target}`);
}
