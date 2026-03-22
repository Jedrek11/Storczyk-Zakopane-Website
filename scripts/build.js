/**
 * Build script — składa strony z szablonów (src/) i partials (partials/).
 * Użycie: node build.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT     = path.join(__dirname, '..');
const SRC_DIR  = path.join(ROOT, 'src');
const PART_DIR = path.join(ROOT, 'partials');
const CONFIG   = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));

// ── Spłaszcz config do mapy klucz→wartość ────────────────────────
function flattenConfig(obj, prefix) {
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null) {
      Object.assign(result, flattenConfig(v, key));
    } else {
      result[key] = String(v);
    }
  }
  return result;
}
const CONFIG_MAP = flattenConfig(CONFIG);

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
  // 1. Partials
  let result = content.replace(/<!-- PARTIAL:([^\s]+) -->/g, (match, name) => {
    if (partials[name] !== undefined) return partials[name];
    console.warn(`  ⚠  Partial "${name}" nie znaleziony — marker pozostawiony`);
    return match;
  });
  // 2. Config: {{klucz.podklucz}}
  result = result.replace(/\{\{([a-zA-Z_.]+)\}\}/g, (match, key) => {
    if (CONFIG_MAP[key] !== undefined) return CONFIG_MAP[key];
    console.warn(`  ⚠  Config "${key}" nie znaleziony — marker pozostawiony`);
    return match;
  });
  return result;
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
