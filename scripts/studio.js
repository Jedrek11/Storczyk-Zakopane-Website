#!/usr/bin/env node
/**
 * ============================================
 *  STUDIO WPISÓW — Willa Storczyk Zakopane
 * ============================================
 *
 *  Lokalny panel do dodawania wpisów blogowych bez dotykania kodu.
 *
 *  Uruchomienie:
 *    node scripts/studio.js
 *  (albo dwuklik: Studio-Wpisow.bat)
 *
 *  Otwiera panel w przeglądarce pod http://localhost:4646
 *
 *  Co robi:
 *    - formularz + edytor treści (nagłówki, akapity, wskazówki, FAQ, zdjęcia)
 *    - upload zdjęć (auto-konwersja do .webp, jeśli dostępny sharp)
 *    - podgląd na żywo
 *    - „Zapisz wpis" → tworzy src/blog-{slug}.html, dodaje kartę,
 *      wpis do sitemap.xml, redirect w netlify.toml i odpala build
 *    - „Opublikuj" → git add + commit + push (wpis idzie na żywą stronę)
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const tpl = require('./blog-template.js');

const ROOT = path.join(__dirname, '..');
const PORT = 4646;
const BLOG_IMG_DIR = path.join(ROOT, 'zdj', 'blog');
const UI_FILE = path.join(__dirname, 'studio-ui.html');

// sharp jest opcjonalny — jeśli jest, optymalizujemy zdjęcia do webp
let sharp = null;
try { sharp = require('sharp'); } catch (_) { /* brak sharp — kopiujemy 1:1 */ }

// ─── Pomocnicze ──────────────────────────────
function sanitizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'zdjecie';
}

function uniqueImagePath(baseName) {
  let name = `${baseName}.webp`;
  let i = 2;
  while (fs.existsSync(path.join(BLOG_IMG_DIR, name))) {
    name = `${baseName}-${i}.webp`;
    i++;
  }
  return name;
}

function listBlogImages() {
  try {
    return fs.readdirSync(BLOG_IMG_DIR)
      .filter(f => /\.(webp|jpg|jpeg|png)$/i.test(f))
      .sort();
  } catch (_) { return []; }
}

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > 60 * 1024 * 1024) { reject(new Error('Plik za duży (limit 60 MB).')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch (e) { reject(new Error('Błędne dane (JSON).')); }
    });
    req.on('error', reject);
  });
}

// ─── Walidacja danych wpisu ──────────────────
function validatePost(d) {
  const errs = [];
  if (!d.slug || !/^[a-z0-9-]+$/.test(d.slug)) errs.push('Slug: tylko małe litery, cyfry i myślniki (np. dolina-chocholowska).');
  if (!d.title || !d.title.trim()) errs.push('Brak tytułu.');
  if (!d.desc || !d.desc.trim()) errs.push('Brak opisu SEO (meta description).');
  if (!d.heroImg || !d.heroImg.trim()) errs.push('Nie wybrano zdjęcia głównego (hero).');
  if (!Array.isArray(d.blocks) || d.blocks.length === 0) errs.push('Treść wpisu jest pusta.');
  return errs;
}

function buildPostHtml(d) {
  const { html, faqSchema } = tpl.renderBody(d.blocks || []);
  return tpl.renderPost({
    slug: d.slug, title: d.title, titleEm: d.titleEm, subtitle: d.subtitle,
    desc: d.desc, keywords: d.keywords, category: d.category,
    heroImg: d.heroImg, photoCredit: d.photoCredit,
    bodyHtml: html, faqSchema
  });
}

// ─── Zapis wpisu do plików + build ───────────
function savePost(d) {
  const log = [];
  const slug = d.slug;
  const srcPath = path.join(ROOT, 'src', `blog-${slug}.html`);

  if (fs.existsSync(srcPath) && !d.overwrite) {
    throw new Error(`Wpis o nazwie "blog-${slug}.html" już istnieje. Zmień slug albo zaznacz nadpisanie.`);
  }

  // 1. Plik wpisu
  fs.writeFileSync(srcPath, buildPostHtml(d), 'utf8');
  log.push(`✓ Utworzono src/blog-${slug}.html`);

  // 2. Karta na blog.html (na górze listy = najnowszy pierwszy)
  const blogPath = path.join(ROOT, 'src', 'blog.html');
  let blogHtml = fs.readFileSync(blogPath, 'utf8');
  if (blogHtml.includes(`href="blog-${slug}.html"`)) {
    log.push('• Karta w blog.html już istniała — pominięto');
  } else {
    const anchor = '<div class="articles-grid">';
    const idx = blogHtml.indexOf(anchor);
    if (idx !== -1) {
      const insertAt = idx + anchor.length;
      const card = '\n\n' + tpl.renderCard(d);
      blogHtml = blogHtml.slice(0, insertAt) + card + blogHtml.slice(insertAt);
      fs.writeFileSync(blogPath, blogHtml, 'utf8');
      log.push('✓ Dodano kartę na blog.html (na górze listy)');
    } else {
      log.push('⚠ Nie znaleziono listy w blog.html — dodaj kartę ręcznie');
    }
  }

  // 3. Sitemap
  const smPath = path.join(ROOT, 'sitemap.xml');
  let sm = fs.readFileSync(smPath, 'utf8');
  const loc = `https://storczykzakopane.pl/blog-${slug}.html`;
  if (sm.includes(loc)) {
    log.push('• Wpis w sitemap.xml już istniał — pominięto');
  } else {
    const today = new Date().toISOString().split('T')[0];
    const entry = `\n  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    sm = sm.replace('</urlset>', entry + '</urlset>');
    fs.writeFileSync(smPath, sm, 'utf8');
    log.push('✓ Dodano wpis do sitemap.xml');
  }

  // 4. Redirect w netlify.toml (ładny URL bez .html)
  const ntPath = path.join(ROOT, 'netlify.toml');
  let nt = fs.readFileSync(ntPath, 'utf8');
  if (nt.includes(`from = "/blog-${slug}"\n`) || nt.includes(`from = "/blog-${slug}"\r`)) {
    log.push('• Redirect w netlify.toml już istniał — pominięto');
  } else {
    const redirect = `[[redirects]]\n  from = "/blog-${slug}"\n  to = "/blog-${slug}.html"\n  status = 301\n  force = true\n\n`;
    // wstaw przed regułą "/blog" (ogólną) lub przed Custom 404
    const marker = '# Redirect blog URLs without .html extension\n';
    if (nt.includes(marker)) {
      nt = nt.replace(marker, marker + redirect);
    } else {
      nt = nt.replace('# Custom 404', redirect + '# Custom 404');
    }
    fs.writeFileSync(ntPath, nt, 'utf8');
    log.push('✓ Dodano redirect w netlify.toml');
  }

  // 5. Build
  try {
    const out = execFileSync(process.execPath, ['scripts/build.js'], { cwd: ROOT, encoding: 'utf8' });
    log.push('✓ Build strony OK');
    out.split('\n').forEach(l => { if (l.trim()) log.push('   ' + l.trim()); });
  } catch (e) {
    throw new Error('Build nie przeszedł: ' + (e.stdout || e.message));
  }

  return log;
}

// ─── Lista istniejących wpisów ───────────────
function listPosts() {
  const dir = path.join(ROOT, 'src');
  return fs.readdirSync(dir)
    .filter(f => /^blog-.+\.html$/.test(f) && f !== 'blog.html')
    .map(f => {
      const slug = f.replace(/^blog-/, '').replace(/\.html$/, '');
      let title = slug;
      try {
        const html = fs.readFileSync(path.join(dir, f), 'utf8');
        const m = html.match(/<title>([^<]*)<\/title>/);
        if (m) title = m[1].split('|')[0].trim();
      } catch (_) {}
      return { slug, title };
    })
    .sort((a, b) => a.title.localeCompare(b.title, 'pl'));
}

// ─── Usunięcie wpisu (wszędzie) ──────────────
function deletePost(slug) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error('Nieprawidłowy slug.');
  const log = [];
  const esc = slug.replace(/[-]/g, '\\$&');

  // 1. Pliki wpisu (src + zbudowany w katalogu głównym)
  const srcPath = path.join(ROOT, 'src', `blog-${slug}.html`);
  if (!fs.existsSync(srcPath)) throw new Error(`Wpis "blog-${slug}" nie istnieje.`);
  fs.unlinkSync(srcPath);
  log.push(`✓ Usunięto src/blog-${slug}.html`);
  const rootPath = path.join(ROOT, `blog-${slug}.html`);
  if (fs.existsSync(rootPath)) { fs.unlinkSync(rootPath); log.push(`✓ Usunięto blog-${slug}.html`); }

  // 2. Karta z blog.html
  const blogPath = path.join(ROOT, 'src', 'blog.html');
  let blogHtml = fs.readFileSync(blogPath, 'utf8');
  const cardRe = new RegExp(`\\s*<a href="blog-${esc}\\.html" class="article-card">[\\s\\S]*?</a>`);
  if (cardRe.test(blogHtml)) {
    blogHtml = blogHtml.replace(cardRe, '');
    fs.writeFileSync(blogPath, blogHtml, 'utf8');
    log.push('✓ Usunięto kartę z blog.html');
  }

  // 3. Wpis z sitemap.xml
  const smPath = path.join(ROOT, 'sitemap.xml');
  let sm = fs.readFileSync(smPath, 'utf8');
  const smRe = new RegExp(`\\s*<url>\\s*<loc>https://storczykzakopane\\.pl/blog-${esc}\\.html</loc>[\\s\\S]*?</url>`);
  if (smRe.test(sm)) { sm = sm.replace(smRe, ''); fs.writeFileSync(smPath, sm, 'utf8'); log.push('✓ Usunięto wpis z sitemap.xml'); }

  // 4. Redirect z netlify.toml
  const ntPath = path.join(ROOT, 'netlify.toml');
  let nt = fs.readFileSync(ntPath, 'utf8');
  const ntRe = new RegExp(`\\[\\[redirects\\]\\]\\s*\\n\\s*from = "/blog-${esc}"\\s*\\n\\s*to = "/blog-${esc}\\.html"\\s*\\n\\s*status = 301\\s*\\n\\s*force = true\\s*\\n+`);
  if (ntRe.test(nt)) { nt = nt.replace(ntRe, ''); fs.writeFileSync(ntPath, nt, 'utf8'); log.push('✓ Usunięto redirect z netlify.toml'); }

  // 5. Build
  try {
    execFileSync(process.execPath, ['scripts/build.js'], { cwd: ROOT, encoding: 'utf8' });
    log.push('✓ Przebudowano stronę');
  } catch (e) {
    throw new Error('Build nie przeszedł: ' + (e.stdout || e.message));
  }

  log.push('');
  log.push('Uwaga: zdjęcia wpisu zostały w folderze zdj/blog/ (mogą być używane gdzie indziej).');
  log.push('Jeśli wpis był już opublikowany — kliknij „Opublikuj", żeby zniknął też z żywej strony.');
  return log;
}

// ─── Publikacja: git add/commit/push ─────────
function publish(d) {
  const log = [];
  const run = (args) => {
    try {
      const out = execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
      return out;
    } catch (e) {
      throw new Error(`git ${args.join(' ')} → ${(e.stderr || e.stdout || e.message).toString().trim()}`);
    }
  };

  run(['add', '-A']);
  log.push('✓ git add');

  const msg = `Nowy wpis: ${d.title} (blog-${d.slug})`;
  try {
    run(['commit', '-m', msg]);
    log.push('✓ git commit — ' + msg);
  } catch (e) {
    if (/nothing to commit/i.test(e.message)) {
      log.push('• Brak zmian do zatwierdzenia (już zacommitowane)');
    } else {
      throw e;
    }
  }

  const push = run(['push']);
  log.push('✓ git push — wysłano na GitHub');
  if (push.trim()) log.push('   ' + push.trim().split('\n').join('\n   '));
  log.push('');
  log.push('🌿 Gotowe! Netlify odświeży stronę w ciągu 1–2 minut.');
  return log;
}

// ─── Serwer HTTP ─────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];

  try {
    // Strona panelu
    if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(UI_FILE, 'utf8'));
      return;
    }

    // Podgląd zdjęć w panelu (serwujemy pliki z zdj/blog)
    if (req.method === 'GET' && url.startsWith('/zdj/blog/')) {
      const fp = path.join(ROOT, decodeURIComponent(url));
      if (fp.startsWith(BLOG_IMG_DIR) && fs.existsSync(fp)) {
        const ext = path.extname(fp).slice(1).toLowerCase();
        const mime = ext === 'webp' ? 'image/webp' : ext === 'png' ? 'image/png' : 'image/jpeg';
        res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' });
        res.end(fs.readFileSync(fp));
        return;
      }
      res.writeHead(404); res.end('nie ma'); return;
    }

    // Lista dostępnych zdjęć
    if (req.method === 'GET' && url === '/api/images') {
      sendJson(res, 200, { images: listBlogImages(), sharp: !!sharp });
      return;
    }

    // Upload zdjęcia (base64)
    if (req.method === 'POST' && url === '/api/upload') {
      const d = await readBody(req);
      const raw = String(d.dataBase64 || '').replace(/^data:[^;]+;base64,/, '');
      if (!raw) throw new Error('Brak danych zdjęcia.');
      const buf = Buffer.from(raw, 'base64');
      const base = (d.slug && /^[a-z0-9-]+$/.test(d.slug))
        ? `blog-${d.slug}-${sanitizeName(d.filename)}`
        : sanitizeName(d.filename);
      const outName = uniqueImagePath(base);
      const outPath = path.join(BLOG_IMG_DIR, outName);

      if (sharp) {
        await sharp(buf).rotate().resize({ width: 1600, withoutEnlargement: true })
          .webp({ quality: 80 }).toFile(outPath);
      } else {
        fs.writeFileSync(outPath, buf);
      }
      sendJson(res, 200, { file: outName });
      return;
    }

    // Podgląd wpisu (zwraca gotowy HTML)
    if (req.method === 'POST' && url === '/api/render') {
      const d = await readBody(req);
      let html = buildPostHtml(d);
      // podmień znaczniki configu i partiale na potrzeby podglądu
      html = html
        .replace(/\{\{urls\.baseUrl\}\}/g, 'https://storczykzakopane.pl')
        .replace(/\{\{business\.nameFull\}\}/g, 'Willa Storczyk Zakopane')
        .replace(/<!-- PARTIAL:[^>]+-->/g, '')
        .replace(/href="\/fonts\//g, 'href="/preview-asset/fonts/')
        .replace(/(src|href)="zdj\//g, '$1="/preview-zdj/');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    // Serwuj zdjęcia dla podglądu
    if (req.method === 'GET' && url.startsWith('/preview-zdj/')) {
      const fp = path.join(ROOT, 'zdj', decodeURIComponent(url.replace('/preview-zdj/', '')));
      if (fp.startsWith(path.join(ROOT, 'zdj')) && fs.existsSync(fp)) {
        const ext = path.extname(fp).slice(1).toLowerCase();
        const mime = ext === 'webp' ? 'image/webp' : ext === 'png' ? 'image/png' : ext === 'svg' ? 'image/svg+xml' : 'image/jpeg';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(fs.readFileSync(fp));
        return;
      }
      res.writeHead(404); res.end(''); return;
    }

    // Serwuj fonty dla podglądu
    if (req.method === 'GET' && url.startsWith('/preview-asset/')) {
      const fp = path.join(ROOT, decodeURIComponent(url.replace('/preview-asset/', '')));
      if (fp.startsWith(ROOT) && fs.existsSync(fp)) {
        const ext = path.extname(fp).slice(1).toLowerCase();
        const mime = ext === 'css' ? 'text/css' : ext === 'woff2' ? 'font/woff2' : 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(fs.readFileSync(fp));
        return;
      }
      res.writeHead(404); res.end(''); return;
    }

    // Zapis wpisu
    if (req.method === 'POST' && url === '/api/save') {
      const d = await readBody(req);
      const errs = validatePost(d);
      if (errs.length) { sendJson(res, 400, { ok: false, errors: errs }); return; }
      const log = savePost(d);
      sendJson(res, 200, { ok: true, log });
      return;
    }

    // Lista wpisów
    if (req.method === 'GET' && url === '/api/posts') {
      sendJson(res, 200, { posts: listPosts() });
      return;
    }

    // Usunięcie wpisu
    if (req.method === 'POST' && url === '/api/delete') {
      const d = await readBody(req);
      const log = deletePost(d.slug);
      sendJson(res, 200, { ok: true, log });
      return;
    }

    // Publikacja (git)
    if (req.method === 'POST' && url === '/api/publish') {
      const d = await readBody(req);
      const log = publish(d);
      sendJson(res, 200, { ok: true, log });
      return;
    }

    res.writeHead(404); res.end('nie ma takiej strony');
  } catch (e) {
    sendJson(res, 500, { ok: false, error: e.message });
  }
});

// Nasłuch WYŁĄCZNIE na localhost — panel nie jest widoczny z sieci lokalnej/internetu
server.listen(PORT, '127.0.0.1', () => {
  const link = `http://localhost:${PORT}`;
  console.log('');
  console.log('  🌿  Studio wpisów — Willa Storczyk');
  console.log('  ────────────────────────────────────');
  console.log(`  Panel działa pod:  ${link}`);
  console.log(`  Optymalizacja zdjęć (sharp): ${sharp ? 'włączona ✓' : 'brak — zdjęcia kopiowane 1:1'}`);
  console.log('  Zamknij okno lub Ctrl+C, żeby wyłączyć.');
  console.log('');
  // spróbuj otworzyć przeglądarkę (Windows/mac/linux)
  const opener = process.platform === 'win32' ? 'explorer'
    : process.platform === 'darwin' ? 'open' : 'xdg-open';
  try { require('child_process').spawn(opener, [link], { detached: true, stdio: 'ignore' }).unref(); } catch (_) {}
});
