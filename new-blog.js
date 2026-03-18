#!/usr/bin/env node
/**
 * ============================================
 *  GENERATOR NOWEGO POSTA BLOGOWEGO
 *  Willa Storczyk Zakopane
 * ============================================
 *
 *  Użycie:
 *    node new-blog.js
 *
 *  Skrypt zapyta Cię o:
 *    - slug (np. "morskie-oko")
 *    - tytuł
 *    - opis SEO
 *    - słowa kluczowe
 *    - kategorię (np. "Góry · Szlaki")
 *    - nazwę zdjęcia hero
 *
 *  Wygeneruje:
 *    - src/blog-{slug}.html  (gotowy post)
 *    - Doda kartę do src/blog.html
 *    - Odpali build.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

  // ─── Zbieramy dane ───────────────────────
  const slug = await ask(C.gold('  Slug ') + C.dim('(np. morskie-oko)') + C.gold(': '));
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    console.log(C.red('  ✗ Slug może zawierać tylko małe litery, cyfry i myślniki!'));
    rl.close(); return;
  }

  const filePath = path.join(__dirname, 'src', `blog-${slug}.html`);
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

  const today = new Date().toISOString().split('T')[0];
  const url = `https://storczykzakopane.pl/blog-${slug}.html`;
  const titleFull = `${title} | Willa Storczyk Zakopane`;

  // Wyciągnij część tytułu przed kursywą
  const titleBefore = titleEm ? title.replace(titleEm, '').replace(/[,–\-]\s*$/, '').trim() : title;
  const h1Html = titleEm
    ? `${titleBefore}, <em>${titleEm}</em>`
    : title;

  const gradient = gradientColor
    ? `style="background: linear-gradient(135deg, ${gradientColor} 0%, ${adjustColor(gradientColor, -20)} 100%);"`
    : '';

  console.log('');
  console.log(C.cyan('  ⏳ Generuję post...'));

  // ─── Szablon posta ───────────────────────
  const postHtml = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "${escHtml(title)}",
    "description": "${escHtml(desc)}",
    "url": "${url}",
    "datePublished": "${today}",
    "dateModified": "${today}",
    "author": {
      "@type": "Organization",
      "name": "Willa Storczyk Zakopane",
      "url": "https://storczykzakopane.pl"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Willa Storczyk Zakopane",
      "url": "https://storczykzakopane.pl"
    },
    "keywords": "${escHtml(keywords)}",
    "inLanguage": "pl",
    "image": {
      "@type": "ImageObject",
      "url": "https://storczykzakopane.pl/zdj/${heroImg}",
      "caption": "${escHtml(title)}"
    },
    "articleBody": "${escHtml(desc)}",
    "isPartOf": {
      "@type": "Blog",
      "name": "Przewodnik po Zakopanem – Willa Storczyk",
      "url": "https://storczykzakopane.pl/blog.html"
    }
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {"@type": "ListItem", "position": 1, "name": "Strona główna", "item": "https://storczykzakopane.pl"},
      {"@type": "ListItem", "position": 2, "name": "Blog", "item": "https://storczykzakopane.pl/blog.html"},
      {"@type": "ListItem", "position": 3, "name": "${escHtml(title)}"}
    ]
  }
  </script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(titleFull)}</title>
  <meta name="description" content="${escHtml(desc)}">
  <meta name="keywords" content="${escHtml(keywords)}">
  <link rel="canonical" href="${url}">
  <!-- OPEN GRAPH -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escHtml(titleFull)}">
  <meta property="og:description" content="${escHtml(desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="https://storczykzakopane.pl/willa-storczyk.webp">
  <meta property="og:locale" content="pl_PL">
  <meta property="og:site_name" content="Willa Storczyk Zakopane">
  <!-- TWITTER CARD -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escHtml(titleFull)}">
  <meta name="twitter:description" content="${escHtml(desc)}">
  <meta name="twitter:image" content="https://storczykzakopane.pl/willa-storczyk.webp">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
  <style>
    :root { --forest:#2c4a2c; --cream:#f5f0e8; --cream-light:#faf7f2; --dark:#1a2a1a; --text-mid:#6b7c6b; --gold:#b8963e; }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Lato', sans-serif; background:var(--cream-light); color:var(--dark); line-height:1.8; }
    nav { position:fixed; top:0; left:0; right:0; z-index:1000; background:rgba(30,42,30,0.96); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); padding:0 2rem; display:flex; align-items:center; justify-content:space-between; height:68px; border-bottom:1px solid rgba(255,255,255,0.08); box-shadow:0 2px 20px rgba(0,0,0,0.25); }
    .nav-brand { display:flex; align-items:center; gap:0.8rem; text-decoration:none; }
    .nav-logo-img { width:46px; height:46px; border-radius:50%; object-fit:cover; border:2px solid rgba(245,240,232,0.25); }
    .nav-brand-text { display:flex; flex-direction:column; line-height:1.1; }
    .nav-brand-name { color:#f5f0e8; font-family:'Playfair Display',serif; font-size:1.2rem; letter-spacing:0.04em; }
    .nav-brand-sub { color:rgba(245,240,232,0.45); font-size:0.65rem; letter-spacing:0.18em; text-transform:uppercase; }
    .nav-back { color:rgba(245,240,232,0.85); font-size:0.78rem; font-weight:700; text-decoration:none; letter-spacing:0.1em; text-transform:uppercase; border:1px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.06); padding:0.45rem 1.2rem; border-radius:50px; transition:all 0.3s; }
    .nav-back:hover { background:rgba(255,255,255,0.14); border-color:rgba(255,255,255,0.4); color:#fff; }
    .article-hero { background:linear-gradient(rgba(20,32,20,0.62),rgba(20,32,20,0.72)),url('zdj/${heroImg}') center/cover no-repeat; padding:5rem 2rem 4rem; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:220px; }
    .article-hero-label { color:var(--gold); font-size:0.75rem; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; margin-bottom:1rem; }
    .article-hero h1 { font-family:'Playfair Display',serif; font-size:2.8rem; color:#f5f0e8; font-weight:400; line-height:1.2; max-width:700px; margin:0 auto; }
    .article-hero h1 em { font-style:italic; color:var(--gold); }
    .article-hero p { color:rgba(245,240,232,0.7); margin-top:1rem; font-size:0.95rem; }
    .container { max-width:760px; margin:0 auto; padding:3rem 2rem 5rem; }
    h2 { font-family:'Playfair Display',serif; font-size:1.5rem; font-weight:700; color:var(--forest); margin:2.5rem 0 0.8rem; }
    p { margin-bottom:1rem; color:#333; font-size:0.95rem; line-height:1.8; text-align:justify; }
    .tip-box { background:white; border-left:3px solid var(--forest); border-radius:0 6px 6px 0; padding:1.2rem 1.5rem; margin:2rem 0; box-shadow:0 2px 12px rgba(0,0,0,0.05); }
    .tip-box strong { display:block; color:var(--forest); font-size:0.8rem; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:0.4rem; }
    .tip-box p { margin:0; font-size:0.9rem; text-align:left; }
    .back-btn { display:inline-flex; align-items:center; gap:0.5rem; color:var(--forest); font-size:0.82rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; text-decoration:none; border:1.5px solid var(--forest); padding:0.7rem 1.4rem; border-radius:4px; margin-top:2rem; transition:all 0.2s; }
    .back-btn:hover { background:var(--forest); color:var(--cream); }
    @media(max-width:768px) { .article-hero h1 { font-size:1.9rem; } }
  </style>
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
</head>
<body>
<!-- MOBILE TOP BAR -->
<!-- PARTIAL:mobile-topbar -->

<nav>
  <a href="index.html" class="nav-brand">
    <img src="zdj/index-img2.webp" alt="Logo Storczyk Zakopane" class="nav-logo-img">
    <div class="nav-brand-text">
      <span class="nav-brand-name">Storczyk</span>
      <span class="nav-brand-sub">Zakopane</span>
    </div>
  </a>
  <a href="blog.html" class="nav-back">← Blog</a>
</nav>
<div class="article-hero">
  <p class="article-hero-label">${escHtml(category)}</p>
  <h1>${h1Html}</h1>
  <p>${escHtml(subtitle)}</p>
</div>

<div style="max-width:900px; margin:0 auto; padding:2rem 2rem 0;">
  <figure style="margin:0; border-radius:8px; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.15);">
    <img src="zdj/${heroImg}" alt="${escHtml(title)}" style="width:100%; height:420px; object-fit:cover; display:block;">
    <figcaption style="background:white; padding:0.6rem 1rem; font-size:0.78rem; color:#888; text-align:right;">
      Fot. ${escHtml(photoCredit || 'Willa Storczyk')}
    </figcaption>
  </figure>
</div>
<div class="container">

  <!-- ═══════════════════════════════════════
       TUTAJ WPISZ TREŚĆ ARTYKUŁU
       Używaj tych bloków:
       ═══════════════════════════════════════ -->

  <h2>Pierwszy nagłówek</h2>
  <p>Treść akapitu...</p>

  <h2>Drugi nagłówek</h2>
  <p>Treść akapitu...</p>

  <!-- TIP BOX — użyj kiedy chcesz dać wskazówkę -->
  <div class="tip-box">
    <strong>💡 Wskazówka</strong>
    <p>Treść wskazówki...</p>
  </div>

  <h2>Jak dojechać z Willi Storczyk?</h2>
  <p>Opis dojazdu z willi...</p>

  <!-- ═══════════════════════════════════════ -->

  <a href="blog.html" class="back-btn">← Wróć do bloga</a>
</div>

<style>
  .float-rez { position:fixed; bottom:2rem; right:2rem; z-index:999; background:rgba(12,18,12,0.72); backdrop-filter:saturate(180%) blur(20px); -webkit-backdrop-filter:saturate(180%) blur(20px); border:1px solid rgba(255,255,255,0.13); color:rgba(245,240,232,0.95); padding:0.85rem 1.6rem; border-radius:50px; display:flex; align-items:center; justify-content:center; font-family:'Lato',sans-serif; font-size:0.82rem; font-weight:700; letter-spacing:0.09em; text-transform:uppercase; text-decoration:none; box-shadow:0 4px 24px rgba(0,0,0,0.35); transition:all 0.3s; white-space:nowrap; opacity:0; pointer-events:none; transform:scale(0.7); }
  .float-rez--visible { opacity:1; pointer-events:auto; transform:scale(1); animation:pulse-rez 2.5s infinite; }
  .float-rez:hover { background:rgba(30,48,30,0.92) !important; border-color:rgba(255,255,255,0.45); box-shadow:0 0 0 3px rgba(255,255,255,0.12), 0 8px 36px rgba(0,0,0,0.55); color:#fff; }
  @keyframes pulse-rez { 0%,100%{box-shadow:0 4px 20px rgba(58,92,58,0.5);} 50%{box-shadow:0 4px 32px rgba(58,92,58,0.9);} }
  .mobile-topbar { display:none; }
  .bottom-nav { display:none; }
  @media (max-width:768px) {
    .mobile-topbar { display:flex; justify-content:center; align-items:center; position:fixed; top:0.5rem; left:50%; transform:translateX(-50%); z-index:997; padding:0.45rem 0.6rem 0.45rem 0.5rem; background:rgba(30,30,30,0.55); backdrop-filter:saturate(180%) blur(28px); -webkit-backdrop-filter:saturate(180%) blur(28px); border-radius:40px; border:1px solid rgba(255,255,255,0.12); }
    .mobile-topbar-brand { display:flex; align-items:center; gap:0.45rem; text-decoration:none; }
    .mobile-topbar-logo { width:26px; height:26px; border-radius:50%; object-fit:cover; }
    .mobile-topbar-url { font-family:'Lato',sans-serif; font-size:0.68rem; font-weight:700; color:rgba(245,240,232,0.9); letter-spacing:0.08em; text-transform:uppercase; }
    .mobile-topbar-back { display:flex; align-items:center; justify-content:center; background:none; border:none; color:rgba(245,240,232,0.7); cursor:pointer; padding:0.3rem; margin-right:0.2rem; border-radius:50%; transition:color 0.2s,background 0.2s; text-decoration:none; }
    .mobile-topbar-back:hover { color:#f5f0e8; background:rgba(255,255,255,0.1); }
    nav:not(.bottom-nav) { display:none !important; }
    .bottom-nav { display:flex; position:fixed; top:auto; bottom:calc(0.5rem + env(safe-area-inset-bottom,0px)); left:0.6rem; right:0.6rem; z-index:9999; background:rgba(30,30,30,0.55); backdrop-filter:saturate(180%) blur(28px); -webkit-backdrop-filter:saturate(180%) blur(28px); padding:0.25rem; justify-content:space-around; align-items:stretch; border:1px solid rgba(255,255,255,0.1); border-radius:40px; }
    .bottom-nav a, .bottom-nav button { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.15rem; color:rgba(245,240,232,0.45); text-decoration:none; font-family:'Lato',sans-serif; font-size:0.55rem; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; background:none; border:none; cursor:pointer; padding:0.5rem 0; transition:color 0.2s,background 0.2s; -webkit-tap-highlight-color:transparent; border-radius:30px; position:relative; flex:1; }
    .bottom-nav a:hover, .bottom-nav button:hover, .bottom-nav a:active, .bottom-nav button:active { color:rgba(245,240,232,0.9); background:rgba(255,255,255,0.12); }
    .bottom-nav a.bnav-active { color:#f5f0e8; background:rgba(255,255,255,0.15); }
    .bottom-nav .bnav-icon { width:20px; height:20px; fill:none; stroke:currentColor; }
    .bottom-nav .bnav-rez { color:#e8b86d; }
    .bottom-nav .bnav-rez:hover, .bottom-nav .bnav-rez:active { color:#f0c878; background:rgba(232,184,109,0.15); }
    .float-rez { display:none !important; }
  footer, .blog-article { padding-bottom:5rem !important; }
  }
</style>
<a href="/#kontakt" class="float-rez">Zarezerwuj pobyt</a>
<script>setTimeout(function(){ var b=document.querySelector('.float-rez'); if(b) b.classList.add('float-rez--visible'); }, 11000);</script>
<!-- PARTIAL:bottom-nav-blog -->

<!-- PARTIAL:mobile-menu-blog -->

<!-- PARTIAL:mobile-menu-css -->

<script>
function toggleMenu() {
  var menu = document.getElementById('mobile-menu');
  var hamburger = document.getElementById('hamburger');
  if (menu.classList.contains('open')) {
    closeMenu();
  } else {
    menu.style.display = 'flex';
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        menu.classList.add('open');
        if (hamburger) hamburger.classList.add('open');
      });
    });
  }
}
(function() {
  var menuBtn = document.querySelector('.bottom-nav button');
  if (menuBtn) {
    var origToggle = window.toggleMenu;
    window.toggleMenu = function() {
      var menu = document.getElementById('mobile-menu');
      var wasOpen = menu.classList.contains('open');
      origToggle();
      if (wasOpen) { menuBtn.classList.remove('bnav-active'); }
      else { menuBtn.classList.add('bnav-active'); }
    };
    var origClose = window.closeMenu;
    window.closeMenu = function() {
      origClose();
      menuBtn.classList.remove('bnav-active');
    };
  }
})();
function closeMenu() {
  var menu = document.getElementById('mobile-menu');
  var hamburger = document.getElementById('hamburger');
  menu.classList.remove('open');
  if (hamburger) hamburger.classList.remove('open');
  menu.addEventListener('transitionend', function handler() {
    if (!menu.classList.contains('open')) { menu.style.display = ''; }
    menu.removeEventListener('transitionend', handler);
  });
}
</script>
</body>
</html>`;

  // ─── Karta do blog.html ──────────────────
  const cardHtml = `
    <a href="blog-${slug}.html" class="article-card">
      <div class="article-thumb" ${gradient}>
        <img src="zdj/${thumbImg || heroImg}" alt="${escHtml(title)}" loading="lazy">
        <span class="article-tag">${escHtml(tag)}</span>
      </div>
      <div class="article-body">
        <h2 class="article-title">${escHtml(title)}</h2>
        <p class="article-excerpt">${escHtml(excerpt)}</p>
        <div class="article-cta">Czytaj więcej <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></div>
      </div>
    </a>`;

  // ─── Zapisz post ─────────────────────────
  fs.writeFileSync(filePath, postHtml, 'utf8');
  console.log(C.green(`  ✓ Utworzono: src/blog-${slug}.html`));

  // ─── Dodaj kartę do blog.html ────────────
  const blogPath = path.join(__dirname, 'src', 'blog.html');
  let blogHtml = fs.readFileSync(blogPath, 'utf8');

  // Wstaw przed zamknięciem </div> articles-grid
  const gridEnd = '  </div>\n</div>';
  if (blogHtml.includes(gridEnd)) {
    blogHtml = blogHtml.replace(gridEnd, cardHtml + '\n\n  </div>\n</div>');
    fs.writeFileSync(blogPath, blogHtml, 'utf8');
    console.log(C.green('  ✓ Dodano kartę do blog.html'));
  } else {
    console.log(C.gold('  ⚠ Nie znaleziono miejsca w blog.html – dodaj kartę ręcznie'));
  }

  // ─── Build ───────────────────────────────
  console.log(C.cyan('  ⏳ Buduję stronę...'));
  const { execSync } = require('child_process');
  try {
    const out = execSync('node build.js', { cwd: __dirname, encoding: 'utf8' });
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
  console.log(`  4. Wrzuć zdjęcia do ${C.dim('zdj/')}`);
  console.log(`  5. Odpal ${C.cyan('node build.js')}`);
  console.log(C.green('  ═══════════════════════════════════════'));
  console.log('');

  rl.close();
}

// ─── Helpers ─────────────────────────────
function escHtml(s) {
  return (s || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function adjustColor(hex, amount) {
  hex = hex.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

main().catch(e => { console.error(C.red('Błąd: ' + e.message)); rl.close(); });
