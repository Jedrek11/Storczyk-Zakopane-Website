/**
 * Watch script — obserwuje src/ i partials/, automatycznie buduje przy zmianach.
 * Użycie: node watch.js
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT     = __dirname;
const SRC_DIR  = path.join(ROOT, 'src');
const PART_DIR = path.join(ROOT, 'partials');

let debounce = null;

function runBuild(changed) {
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    console.log(`\n🔄 Zmiana wykryta: ${changed} — buduję...`);
    try {
      execSync('node build.js', { cwd: ROOT, stdio: 'inherit' });
    } catch (e) {
      // błąd już wydrukowany przez build.js
    }
  }, 150);
}

function watchDir(dir) {
  fs.watch(dir, { recursive: false }, (event, filename) => {
    if (filename && filename.endsWith('.html')) {
      runBuild(path.join(path.basename(dir), filename));
    }
  });
  console.log(`  👁  Obserwuję: ${path.relative(ROOT, dir)}/`);
}

// Uruchom build przy starcie
console.log('🔨 Budowanie początkowe...');
try {
  execSync('node build.js', { cwd: ROOT, stdio: 'inherit' });
} catch (e) {
  process.exit(1);
}

console.log('👀 Tryb watch aktywny. Ctrl+C aby zatrzymać.\n');
watchDir(SRC_DIR);
watchDir(PART_DIR);
