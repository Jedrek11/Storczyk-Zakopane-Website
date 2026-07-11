#!/usr/bin/env node
/**
 * ============================================
 *  GENERATOR NOWEGO POSTA BLOGOWEGO (terminal)
 *  Willa Storczyk Zakopane
 * ============================================
 *
 *  Wygodniejsza alternatywa: node scripts/studio.js  (panel w przeglądarce)
 *
 *  Użycie:
 *    node scripts/new-blog.js
 *
 *  Tworzy szkielet wpisu (src/blog-{slug}.html), dodaje kartę na blog.html
 *  i odpala build. Treść wpisu uzupełniasz potem ręcznie w pliku.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const tpl = require('./blog-template.js');

const ROOT = path.join(__dirname, '..');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(r => rl.question(q, r));

// ─── Kolory w terminalu ──────────────────────
const C = {
  green: s => `\x1b[32m${s}\x1b[0m`,
  gold:  s => `\x1b[33m${s}\x1b[0m`,
  cyan:  s => `\x1b[36m${s}\x1b[0m`,
  dim:   s => `\x1b[2m${s}\x1b[0m`,
  bold:  s => `\x1b[1m${s}\x1b[0m`,
  red:   s => `\x1b[31m${s}\x1b[0m`,
};

async function main() {
  console.log('');
  console.log(C.green('╔══════════════════════════════════════════╗'));
  console.log(C.green('║') + C.bold('  🌿 Generator Bloga – Willa Storczyk   ') + C.green('║'));
  console.log(C.green('╚══════════════════════════════════════════╝'));
  console.log('');
  console.log(C.dim('  Wskazówka: klikany panel to  node scripts/studio.js'));
  console.log('');

  // ─── Zbieramy dane ───────────────────────
  const slug = await ask(C.gold('  Slug ') + C.dim('(np. morskie-oko)') + C.gold(': '));
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    console.log(C.red('  ✗ Slug może zawierać tylko małe litery, cyfry i myślniki!'));
    rl.close(); return;
  }

  const filePath = path.join(ROOT, 'src', `blog-${slug}.html`);
  if (fs.existsSync(filePath)) {
    console.log(C.red(`  ✗ Plik blog-${slug}.html już istnieje!`));
    rl.close(); return;
  }

  const title     = await ask(C.gold('  Tytuł ') + C.dim('(np. Morskie Oko – najpiękniejsze jezioro)') + C.gold(': '));
  const titleEm   = await ask(C.gold('  Tytuł (część kursywą) ') + C.dim('(np. najpiękniejsze jezioro)') + C.gold(': '));
  const subtitle  = await ask(C.gold('  Podtytuł hero ') + C.dim('(krótki opis pod tytułem)') + C.gold(': '));
  const desc      = await ask(C.gold('  Opis SEO ') + C.dim('(meta description, 150-160 znaków)') + C.gold(': '));
  const keywords  = await ask(C.gold('  Słowa kluczowe ') + C.dim('(np. Morskie Oko, szlak, Tatry)') + C.gold(': '));
  const category  = await ask(C.gold('  Kategoria hero ') + C.dim('(np. Góry · Szlaki)') + C.gold(': '));
  const tag       = await ask(C.gold('  Tag na karcie ') + C.dim('(np. Góry, Relaks, Widoki)') + C.gold(': '));
  const excerpt   = await ask(C.gold('  Zajawka na karcie ') + C.dim('(2-3 zdania na stronę bloga)') + C.gold(': '));
  const heroImg   = await ask(C.gold('  Zdjęcie hero ') + C.dim(`(np. blog-${slug}-img1.webp)`) + C.gold(': '));
  const thumbImg  = await ask(C.gold('  Zdjęcie miniatura ') + C.dim(`(np. blog-${slug}-img2.webp)`) + C.gold(': '));
  const photoCredit = await ask(C.gold('  Autor zdjęcia ') + C.dim('(np. Jan Kowalski)') + C.gold(': '));
  const gradientColor = await ask(C.gold('  Kolor gradientu karty ') + C.dim('(np. #2c4a2c lub Enter = domyślny)') + C.gold(': '));

  console.log('');
  console.log(C.cyan('  ⏳ Generuję post...'));

  // ─── Szkielet treści (uzupełnisz ręcznie) ─
  const bodyHtml =
`  <!-- ═══════════════════════════════════════
       TUTAJ WPISZ TREŚĆ ARTYKUŁU
       ═══════════════════════════════════════ -->

  <h2>Pierwszy nagłówek</h2>
  <p>Treść akapitu...</p>

  <h2>Drugi nagłówek</h2>
  <p>Treść akapitu...</p>

  <div class="tip-box">
    <strong>💡 Wskazówka</strong>
    <p>Treść wskazówki...</p>
  </div>

  <h2>Jak dojechać z Willi Storczyk?</h2>
  <p>Opis dojazdu z willi...</p>`;

  const postHtml = tpl.renderPost({
    slug, title, titleEm, subtitle, desc, keywords, category,
    heroImg: heroImg || `blog-${slug}-img1.webp`, photoCredit,
    bodyHtml, faqSchema: ''
  });

  const cardHtml = '\n' + tpl.renderCard({ slug, title, tag, excerpt, heroImg, thumbImg, gradientColor });

  // ─── Zapisz post ─────────────────────────
  fs.writeFileSync(filePath, postHtml, 'utf8');
  console.log(C.green(`  ✓ Utworzono: src/blog-${slug}.html`));

  // ─── Dodaj kartę na górze listy blog.html ─
  const blogPath = path.join(ROOT, 'src', 'blog.html');
  let blogHtml = fs.readFileSync(blogPath, 'utf8');
  const anchor = '<div class="articles-grid">';
  const idx = blogHtml.indexOf(anchor);
  if (idx !== -1) {
    const at = idx + anchor.length;
    blogHtml = blogHtml.slice(0, at) + '\n' + cardHtml + blogHtml.slice(at);
    fs.writeFileSync(blogPath, blogHtml, 'utf8');
    console.log(C.green('  ✓ Dodano kartę do blog.html'));
  } else {
    console.log(C.gold('  ⚠ Nie znaleziono miejsca w blog.html – dodaj kartę ręcznie'));
  }

  // ─── Build ───────────────────────────────
  console.log(C.cyan('  ⏳ Buduję stronę...'));
  const { execSync } = require('child_process');
  try {
    const out = execSync('node scripts/build.js', { cwd: ROOT, encoding: 'utf8' });
    console.log(out.split('\n').map(l => '  ' + l).join('\n'));
  } catch (e) {
    console.log(C.red('  ✗ Błąd buildu: ' + e.message));
  }

  // ─── Podsumowanie ────────────────────────
  console.log('');
  console.log(C.green('  ═══════════════════════════════════════'));
  console.log(C.green('  ✅ GOTOWE!'));
  console.log('');
  console.log(C.bold('  Co teraz:'));
  console.log(`  1. Otwórz ${C.cyan(`src/blog-${slug}.html`)}`);
  console.log(`  2. Znajdź komentarz ${C.dim('<!-- TUTAJ WPISZ TREŚĆ ARTYKUŁU -->')}`);
  console.log(`  3. Dodaj nagłówki ${C.dim('<h2>')} i akapity ${C.dim('<p>')}`);
  console.log(`  4. Wrzuć zdjęcia do ${C.dim('zdj/blog/')}`);
  console.log(`  5. Odpal ${C.cyan('node scripts/build.js')}`);
  console.log(C.green('  ═══════════════════════════════════════'));
  console.log('');

  rl.close();
}

main().catch(e => { console.error(C.red('Błąd: ' + e.message)); rl.close(); });
