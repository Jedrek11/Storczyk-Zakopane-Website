/**
 * Generuje miniatury kafelków bloga (zdj/blog/thumbs/) w dwóch szerokościach.
 * Oryginały zostają nietknięte – to osobne pliki tylko dla listy wpisów.
 * Użycie: node scripts/make-thumbs.js
 */

const sharp = require('sharp');
const fs    = require('fs');
const path  = require('path');

const ROOT      = path.join(__dirname, '..');
const BLOG_SRC  = path.join(ROOT, 'src', 'blog.html');
const THUMB_DIR = path.join(ROOT, 'zdj', 'blog', 'thumbs');
const WIDTHS    = [400, 800];
const QUALITY   = 72;

function fmt(bytes) {
  return bytes < 1024 * 1024
    ? (bytes / 1024).toFixed(0) + ' KB'
    : (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Zbierz obrazki kafelków z szablonu listy (bez tła hero).
// Rozpoznaje zarówno ścieżki oryginałów, jak i gotowe miniatury,
// żeby skrypt dało się uruchomić ponownie po przebudowie szablonu.
function collectSources() {
  const html = fs.readFileSync(BLOG_SRC, 'utf8');
  const found = new Set();
  const re = /zdj\/blog\/(thumbs\/)?([A-Za-z0-9._-]+?)(-400|-800)?\.webp/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (m[2].includes('hero-bg')) continue;
    found.add(m[2] + '.webp');
  }
  return [...found].sort();
}

// Tło hero w dwóch szerokościach (desktop / telefon)
async function makeHero() {
  const src = path.join(ROOT, 'zdj', 'blog', 'blog-hero-bg.webp');
  if (!fs.existsSync(src)) return;

  const input = fs.readFileSync(src);
  const meta  = await sharp(input).metadata();
  console.log(`\nTło hero (oryginał ${meta.width}x${meta.height}, ${fmt(input.length)}):`);

  // Hero to szeroki pasek, więc kadrujemy zamiast wozić całe 4:3
  const warianty = [
    { w: 1280, h: 512 },  // desktop (bez powiększania oryginału 1280px)
    { w: 800,  h: 600 },  // telefon (pasek jest tam wyższy niż szerszy)
  ];

  for (const { w, h } of warianty) {
    const buf = await sharp(input)
      .resize(w, h, { fit: 'cover', position: 'attention' })
      .webp({ quality: 68, effort: 6 })
      .toBuffer();
    fs.writeFileSync(path.join(THUMB_DIR, `blog-hero-bg-${w}.webp`), buf);
    console.log(`  ✓  blog-hero-bg-${w}.webp (${w}x${h}) → ${fmt(buf.length)}`);
  }
}

async function main() {
  fs.mkdirSync(THUMB_DIR, { recursive: true });

  const sources = collectSources();
  console.log(`Znaleziono ${sources.length} obrazków kafelków.\n`);

  let before = 0, after = 0, missing = 0;

  for (const file of sources) {
    const src = path.join(ROOT, 'zdj', 'blog', file);
    if (!fs.existsSync(src)) {
      console.warn(`  ⚠  brak pliku: ${file}`);
      missing++;
      continue;
    }

    before += fs.statSync(src).size;
    const base = path.basename(file, '.webp');
    const input = fs.readFileSync(src);
    const parts = [];

    for (const w of WIDTHS) {
      const buf = await sharp(input)
        .resize(w, Math.round(w * 0.625), { fit: 'cover', position: 'attention' })
        .webp({ quality: QUALITY, effort: 6 })
        .toBuffer();
      fs.writeFileSync(path.join(THUMB_DIR, `${base}-${w}.webp`), buf);
      after += buf.length;
      parts.push(`${w}w ${fmt(buf.length)}`);
    }

    console.log(`  ✓  ${file} → ${parts.join(', ')}`);
  }

  await makeHero();

  console.log('\n=== PODSUMOWANIE ===');
  console.log(`Oryginały:  ${fmt(before)}`);
  console.log(`Miniatury:  ${fmt(after)} (obie szerokości razem)`);
  if (missing) console.log(`Brakujące pliki: ${missing}`);
}

main().catch(e => { console.error(e); process.exit(1); });
