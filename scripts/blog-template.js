/**
 * ============================================
 *  WSPÓLNY SZABLON WPISU BLOGOWEGO
 *  Willa Storczyk Zakopane
 * ============================================
 *
 *  Jedno źródło prawdy dla generowania wpisów.
 *  Używane przez:
 *    - scripts/studio.js     (panel „Studio wpisów")
 *    - scripts/new-blog.js   (generator w terminalu)
 *
 *  Eksportuje:
 *    escHtml, adjustColor      — pomocnicze
 *    inline                    — formatowanie **pogrubień** i [linków](url)
 *    renderBody(blocks)        — zamienia bloki edytora na HTML treści
 *    renderPost(data)          — pełny HTML gotowego wpisu
 *    renderCard(data)          — karta wpisu na blog.html
 */

'use strict';

// ─── Pomocnicze ──────────────────────────────
function escHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// escape dla treści wewnątrz JSON-LD (schema)
function escJson(s) {
  return (s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ').trim();
}

function adjustColor(hex, amount) {
  hex = String(hex || '').replace('#', '');
  if (hex.length !== 6) return '#1a2a1a';
  const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ─── Formatowanie inline: **pogrubienie** i [tekst](url) ─────────────
function inline(s) {
  let t = escHtml(s);
  // linki [tekst](url)
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, txt, url) => {
    const ext = /^https?:\/\//i.test(url);
    return `<a href="${url}"${ext ? ' target="_blank" rel="noopener"' : ''}>${txt}</a>`;
  });
  // pogrubienie **tekst**
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return t;
}

// ─── Renderowanie pojedynczego bloku treści ──────────────────────────
function renderBlock(block, ctx) {
  const type = block.type;

  if (type === 'heading') {
    return `  <h2>${inline(block.text || '')}</h2>`;
  }

  if (type === 'paragraph') {
    // pusty wiersz = nowy akapit; pojedynczy enter = <br>
    const chunks = String(block.text || '').split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
    return chunks.map(ch => `  <p>${inline(ch).replace(/\n/g, '<br>')}</p>`).join('\n');
  }

  if (type === 'list') {
    const items = (Array.isArray(block.items) ? block.items : String(block.items || block.text || '').split('\n'))
      .map(s => String(s).trim()).filter(Boolean);
    if (!items.length) return '';
    const lis = items.map(it => `    <li>${inline(it)}</li>`).join('\n');
    return `  <ul style="margin:0.5rem 0 1rem 1.5rem; line-height:2.2; color:#333; font-size:0.95rem;">\n${lis}\n  </ul>`;
  }

  if (type === 'tip') {
    const title = inline(block.title || 'Wskazówka');
    const body = inline(block.text || '');
    return `  <div class="tip-box">\n    <strong>${title}</strong>\n    <p>${body}</p>\n  </div>`;
  }

  if (type === 'image') {
    const file = String(block.file || '').trim();
    if (!file) return '';
    const alt = escHtml(block.alt || block.caption || '');
    const credit = (block.credit || '').trim();
    const cap = credit
      ? `\n    <figcaption style="background:white; padding:0.6rem 1rem; font-size:0.78rem; color:#888; text-align:right;">Fot. ${escHtml(credit)}</figcaption>`
      : '';
    return `  <figure style="margin:2rem auto; max-width:760px; border-radius:8px; overflow:hidden; box-shadow:0 6px 24px rgba(0,0,0,0.12);">\n    <img src="zdj/blog/${file}" alt="${alt}" style="width:100%; height:auto; display:block;" loading="lazy">${cap}\n  </figure>`;
  }

  if (type === 'faq') {
    const heading = escHtml(block.heading || 'Najczęściej zadawane pytania');
    const items = (block.items || []).filter(it => (it.q || '').trim() && (it.a || '').trim());
    if (!items.length) return '';
    // zbierz do schematu FAQPage
    ctx.faqItems.push(...items);
    const rows = items.map(it =>
      `    <div class="faq-item">\n      <h3 class="faq-q">${inline(it.q)}</h3>\n      <p class="faq-a">${inline(it.a)}</p>\n    </div>`
    ).join('\n');
    return `  <section class="faq">\n    <span class="faq-label">Pytania i odpowiedzi</span>\n    <h2>${heading}</h2>\n${rows}\n  </section>`;
  }

  if (type === 'cta-nocleg') {
    return `  <div class="tip-box ctabox-nocleg">\n    <strong>Nocleg w Zakopanem</strong>\n    <p>Szukasz bazy wypadowej w Tatry? <a href="index.html">Willa Storczyk</a> to noclegi w Zakopanem z bezpłatnym parkingiem, blisko Krupówek.</p>\n  </div>`;
  }

  if (type === 'html') {
    return '  ' + String(block.html || '');
  }

  return '';
}

// ─── Renderowanie całej treści + schematu FAQ ────────────────────────
function renderBody(blocks) {
  const ctx = { faqItems: [] };
  const html = (blocks || []).map(b => renderBlock(b, ctx)).filter(Boolean).join('\n\n');

  let faqSchema = '';
  if (ctx.faqItems.length) {
    const entities = ctx.faqItems.map(it =>
      `      {\n        "@type": "Question",\n        "name": "${escJson(it.q)}",\n        "acceptedAnswer": {"@type": "Answer", "text": "${escJson(it.a)}"}\n      }`
    ).join(',\n');
    faqSchema =
`  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
${entities}
    ]
  }
  </script>
`;
  }

  return { html, faqSchema };
}

// ─── Pełny HTML wpisu ────────────────────────────────────────────────
function renderPost(data) {
  const {
    slug, title, titleEm, subtitle, desc, keywords, category,
    heroImg, photoCredit, bodyHtml = '', faqSchema = ''
  } = data;

  const today = data.date || new Date().toISOString().split('T')[0];
  const url = `{{urls.baseUrl}}/blog-${slug}.html`;
  const titleFull = `${title} | {{business.nameFull}}`;

  // Zawiń część tytułu kursywą (zachowuje oryginalną interpunkcję)
  const titleEsc = escHtml(title);
  const h1Html = (titleEm && titleEsc.includes(escHtml(titleEm)))
    ? titleEsc.replace(escHtml(titleEm), `<em>${escHtml(titleEm)}</em>`)
    : titleEsc;

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "${escJson(title)}",
    "description": "${escJson(desc)}",
    "url": "${url}",
    "datePublished": "${today}",
    "dateModified": "${today}",
    "author": {
      "@type": "Organization",
      "name": "{{business.nameFull}}",
      "url": "{{urls.baseUrl}}"
    },
    "publisher": {
      "@type": "Organization",
      "name": "{{business.nameFull}}",
      "url": "{{urls.baseUrl}}"
    },
    "keywords": "${escJson(keywords)}",
    "inLanguage": "pl",
    "image": {
      "@type": "ImageObject",
      "url": "{{urls.baseUrl}}/zdj/blog/${heroImg}",
      "caption": "${escJson(title)}"
    },
    "articleBody": "${escJson(desc)}",
    "isPartOf": {
      "@type": "Blog",
      "name": "Przewodnik po Zakopanem – Willa Storczyk",
      "url": "{{urls.baseUrl}}/blog.html"
    }
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {"@type": "ListItem", "position": 1, "name": "Strona główna", "item": "{{urls.baseUrl}}"},
      {"@type": "ListItem", "position": 2, "name": "Blog", "item": "{{urls.baseUrl}}/blog.html"},
      {"@type": "ListItem", "position": 3, "name": "${escJson(title)}"}
    ]
  }
  </script>
${faqSchema}  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(titleFull)}</title>
  <meta name="description" content="${escHtml(desc)}">
  <meta name="keywords" content="${escHtml(keywords)}">
  <link rel="canonical" href="${url}">
  <!-- OPEN GRAPH -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escHtml(titleFull)}">
  <meta property="og:description" content="${escHtml(desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="{{urls.baseUrl}}/assets/willa-storczyk.webp">
  <meta property="og:locale" content="pl_PL">
  <meta property="og:site_name" content="{{business.nameFull}}">
  <!-- TWITTER CARD -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escHtml(titleFull)}">
  <meta name="twitter:description" content="${escHtml(desc)}">
  <meta name="twitter:image" content="{{urls.baseUrl}}/assets/willa-storczyk.webp">

  <link href="/fonts/google-fonts.css" rel="stylesheet">
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
    .article-hero { background:linear-gradient(rgba(20,32,20,0.62),rgba(20,32,20,0.72)),url('zdj/blog/${heroImg}') center/cover no-repeat; padding:5rem 2rem 4rem; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:220px; }
    .article-hero-label { color:var(--gold); font-size:0.75rem; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; margin-bottom:1rem; }
    .article-hero h1 { font-family:'Playfair Display',serif; font-size:2.8rem; color:#f5f0e8; font-weight:400; line-height:1.2; max-width:700px; margin:0 auto; }
    .article-hero h1 em { font-style:italic; color:var(--gold); }
    .article-hero p { color:rgba(245,240,232,0.7); margin-top:1rem; font-size:0.95rem; }
    .container { max-width:760px; margin:0 auto; padding:3rem 2rem 5rem; }
    h2 { font-family:'Playfair Display',serif; font-size:1.5rem; font-weight:700; color:var(--forest); margin:2.5rem 0 0.8rem; }
    h3 { font-family:'Playfair Display',serif; font-size:1.15rem; font-weight:700; color:var(--dark); margin:1.8rem 0 0.4rem; }
    p { margin-bottom:1rem; color:#333; font-size:0.95rem; line-height:1.8; text-align:justify; }
    p a, li a, .tip-box a { color:var(--forest); font-weight:700; }
    ul, ol { margin:0.5rem 0 1rem 1.5rem; }
    .tip-box { background:white; border-left:3px solid var(--forest); border-radius:0 6px 6px 0; padding:1.2rem 1.5rem; margin:2rem 0; box-shadow:0 2px 12px rgba(0,0,0,0.05); }
    .tip-box strong { display:block; color:var(--forest); font-size:0.8rem; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:0.4rem; }
    .tip-box p { margin:0; font-size:0.9rem; text-align:left; }
    .ctabox-nocleg { border-left-color:var(--gold); }
    .ctabox-nocleg strong { color:var(--gold); }
    .back-btn { display:flex; width:max-content; align-items:center; gap:0.5rem; margin:2.5rem auto 0; color:var(--forest); font-size:0.85rem; font-weight:700; letter-spacing:0.02em; text-decoration:none; background:#fff; border:1px solid rgba(44,74,44,0.32); padding:0.65rem 1.5rem; border-radius:50px; transition:color 0.2s, border-color 0.2s, background 0.2s; }
    .back-btn:hover { background:rgba(44,74,44,0.08); border-color:var(--forest); color:var(--forest); }
    @media(max-width:768px) { .back-btn { display:none; } }
    .faq { background:linear-gradient(160deg,#ffffff 0%,#f7f2e9 100%); border:1px solid rgba(44,74,44,0.10); border-radius:16px; padding:2rem 2rem 1.7rem; margin:3rem 0; box-shadow:0 10px 34px rgba(28,50,32,0.08); position:relative; overflow:hidden; }
    .faq::before { content:''; position:absolute; left:0; top:0; width:100%; height:4px; background:linear-gradient(90deg,var(--forest) 0%,#b8963e 100%); }
    .faq-label { display:block; color:var(--gold); font-size:0.7rem; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; margin-bottom:0.35rem; }
    .faq h2 { margin:0 0 1.3rem; font-size:1.5rem; }
    .faq-item { background:#fff; border:1px solid rgba(44,74,44,0.08); border-radius:10px; padding:1.05rem 1.3rem; margin-bottom:0.7rem; box-shadow:0 2px 10px rgba(28,50,32,0.05); transition:transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
    .faq-item:hover { transform:translateY(-2px); box-shadow:0 8px 22px rgba(28,50,32,0.10); border-color:rgba(184,150,62,0.45); }
    .faq-item:last-child { margin-bottom:0; }
    .faq-q { font-family:'Playfair Display',serif; font-size:1.05rem; font-weight:700; color:var(--forest); margin:0 0 0.4rem; padding-left:2rem; position:relative; line-height:1.45; }
    .faq-q::before { content:'?'; position:absolute; left:0; top:0.1rem; width:1.4rem; height:1.4rem; border-radius:50%; background:rgba(184,150,62,0.14); color:var(--gold); font-family:'Lato',sans-serif; font-size:0.8rem; font-weight:700; display:flex; align-items:center; justify-content:center; }
    .faq-a { margin:0 0 0.5rem; padding-left:2rem; font-size:0.92rem; line-height:1.75; color:#444; text-align:left; }
    .faq-a:last-child { margin-bottom:0; }
    @media(max-width:768px) { .article-hero h1 { font-size:1.9rem; } }
    @media(max-width:768px) { .faq { padding:1.5rem 1.1rem 1.2rem; border-radius:12px; margin:2.2rem 0; } .faq h2 { font-size:1.25rem; } .faq-item { padding:0.95rem 1rem; } }
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
    <img src="zdj/gallery/nav-logo.webp" alt="Logo Storczyk Zakopane" class="nav-logo-img">
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
    <img src="zdj/blog/${heroImg}" alt="${escHtml(title)}" style="width:100%; height:420px; object-fit:cover; display:block;">
    <figcaption style="background:white; padding:0.6rem 1rem; font-size:0.78rem; color:#888; text-align:right;">
      Fot. ${escHtml(photoCredit || 'Willa Storczyk')}
    </figcaption>
  </figure>
</div>
<div class="container">

${bodyHtml}

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

<!-- PARTIAL:mobile-menu-styles -->

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
}

// ─── Karta wpisu na blog.html ────────────────────────────────────────
function renderCard(data) {
  const { slug, title, tag, excerpt, heroImg, thumbImg, gradientColor } = data;
  const gradient = gradientColor
    ? ` style="background: linear-gradient(135deg, ${gradientColor} 0%, ${adjustColor(gradientColor, -20)} 100%);"`
    : '';
  return `    <a href="blog-${slug}.html" class="article-card">
      <div class="article-thumb"${gradient}>
        <img src="zdj/blog/${thumbImg || heroImg}" alt="${escHtml(title)}" loading="lazy">
        <span class="article-tag">${escHtml(tag)}</span>
      </div>
      <div class="article-body">
        <h2 class="article-title">${escHtml(title)}</h2>
        <p class="article-excerpt">${escHtml(excerpt)}</p>
        <div class="article-cta">Czytaj więcej <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></div>
      </div>
    </a>`;
}

module.exports = { escHtml, escJson, adjustColor, inline, renderBody, renderPost, renderCard };
