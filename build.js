/**
 * Build script — składa strony z szablonów (src/) i partials (partials/).
 * Użycie: node build.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT     = __dirname;
const SRC_DIR  = path.join(ROOT, 'src');
const PART_DIR = path.join(ROOT, 'partials');

// ── Wczytaj wszystkie partials ─────────────────────────────────────
function loadPartials() {
  const partials = {};
  fs.readdirSync(PART_DIR)
    .filter(f => f.endsWith('.html'))
    .forEach(f => {
      const name = path.basename(f, '.html');
      partials[name] = fs.readFileSync(path.join(PART_DIR, f), 'utf8').trimEnd();
    });
  return partials;
}

// ── Zastąp markery zawartością partials ───────────────────────────
function processTemplate(content, partials) {
  return content.replace(/<!-- PARTIAL:([^\s]+) -->/g, (match, name) => {
    if (partials[name] !== undefined) return partials[name];
    console.warn(`  ⚠  Partial "${name}" nie znaleziony — marker pozostawiony`);
    return match;
  });
}

// ── Główna funkcja build ───────────────────────────────────────────
function build() {
  const start    = Date.now();
  const partials = loadPartials();
  const files    = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.html'));

  let ok = 0, err = 0;

  files.forEach(file => {
    try {
      const src       = path.join(SRC_DIR, file);
      const out       = path.join(ROOT, file);
      const content   = fs.readFileSync(src, 'utf8');
      const processed = processTemplate(content, partials);
      fs.writeFileSync(out, processed, 'utf8');
      console.log(`  ✓  ${file}`);
      ok++;
    } catch (e) {
      console.error(`  ✗  ${file}: ${e.message}`);
      err++;
    }
  });

  const ms = Date.now() - start;
  console.log(`\n${err === 0 ? '✅' : '⚠'} Build: ${ok} stron, ${err} błędów (${ms}ms)\n`);
  if (err > 0) process.exit(1);
}

build();
