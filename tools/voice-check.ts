// Fails on the patterns docs/VOICE.md bans. Run: bun tools/voice-check.ts
import { readFileSync } from 'node:fs';
import { Glob } from 'bun';
const banned: [RegExp, string][] = [
  [/—/, 'em dash'],
  [/–/, 'en dash'],
  [/\b(delve|tapestry|testament|realm|harness|seamless(ly)?|elevate|unlock|robust|cutting-edge|game-changer|pivotal|meticulous(ly)?|leverage)\b/i, 'puffery word'],
  [/it'?s important to note|in today's fast-paced/i, 'filler'],
  [/\bserves as\b/i, '"serves as"'],
  [/\b(Moreover|Furthermore|Additionally),/, 'stacked connector'],
  [/\bnot just\b/i, 'contrast reframe'],
];
const patterns = ['README.md', 'AGENTS.md', 'CONTRIBUTING.md', 'llms.txt', 'docs/**/*.md', 'lab/README.md', 'apps/**/*.html', 'apps/**/*.ts'];
const files = patterns.flatMap(p => [...new Glob(p).scanSync('.')]);
if (!files.length) { console.log('no files matched: check the patterns'); process.exit(1); }
let bad = 0;
for (const f of files) {
  if (f.endsWith('VOICE.md')) continue; // lists the bans on purpose
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    for (const [re, why] of banned) if (re.test(line)) { console.log(`${f}:${i + 1}: ${why}: ${line.trim().slice(0, 100)}`); bad++; }
  });
}
console.log(bad ? `${bad} voice problems` : `voice ok (${files.length} files)`);
process.exit(bad ? 1 : 0);
