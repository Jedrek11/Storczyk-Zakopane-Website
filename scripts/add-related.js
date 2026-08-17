/**
 * Wstawia sekcje "Zobacz tez" na koncu artykulow blogowych.
 * Linki sa dobrane tematycznie, ale celowo dowiazuja mocniej cztery strony,
 * ktore w Search Console stoja tuz za pierwsza strona Google albo wypadly
 * z indeksu: morskie-oko, kasprowy-wierch, rowery, gubalowka.
 *
 * Skrypt jest idempotentny - ponowne uruchomienie niczego nie zdubluje.
 * Uzycie: node scripts/add-related.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT    = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');

// Tytul + krotki opis pokazywany pod linkiem
const WPISY = {
  'blog-zakopane-na-weekend.html':   ['Zakopane na weekend', 'Gotowy plan na dwa lub trzy dni'],
  'blog-zakopane-gdy-pada-deszcz.html': ['Co robić, gdy pada deszcz', 'Plan awaryjny na tatrzańską pogodę'],
  'blog-zakopane-z-dziecmi.html':    ['Zakopane z dziećmi', 'Łatwe szlaki i atrakcje dla rodzin'],
  'blog-plakat-150-lat-kenara.html': ['Plakat na 150-lecie Kenara', 'Zakopiańskie liceum plastyczne'],
  'blog-tadeusz-pawlowski.html':     ['Tadeusz Pawłowski „Pstruś”', 'Taternik i założyciel GOPR'],
  'blog-narty-zakopane.html':        ['Narty w Zakopanem', 'Stoki, karnety i wypożyczalnie'],
  'blog-kasprowy-wierch.html':       ['Kasprowy Wierch', 'Kolejka, ceny i dojazd spod willi'],
  'blog-krupowki.html':              ['Krupówki', 'Serce Zakopanego i okolice deptaka'],
  'blog-gubalowka.html':             ['Gubałówka', 'Panorama Tatr i spacer dla każdego'],
  'blog-komunikacja.html':           ['Komunikacja miejska', 'Autobusy, bilety i dojazd pod szlaki'],
  'blog-rowery.html':                ['Wycieczki rowerowe w Tatry', 'Trzy trasy, gdzie rower jest legalny'],
  'blog-skywalk.html':               ['SkyWalk Serce Poronina', 'Platforma widokowa nad Podhalem'],
  'blog-wielkanocne-jajo.html':      ['Wielkanocne Jajo na Kalatówkach', 'Retro zawody na drewnianych nartach'],
  'blog-termy.html':                 ['Termy koło Zakopanego', 'Cztery baseny termalne w okolicy'],
  'blog-morskie-oko.html':           ['Morskie Oko', 'Dojazd, parking i szlak nad jezioro'],
  'blog-dolina-koscieliska.html':    ['Dolina Kościeliska', 'Jaskinie i łagodny spacer doliną'],
  'blog-giewont.html':               ['Giewont', 'Wejście na szczyt z krzyżem'],
  'blog-jak-dojechac.html':          ['Jak dojechać do Zakopanego', 'Pociąg, autobus czy samochód'],
};

// Kto linkuje do kogo
const POWIAZANIA = {
  'blog-zakopane-na-weekend.html':      ['blog-morskie-oko.html', 'blog-kasprowy-wierch.html', 'blog-termy.html'],
  'blog-zakopane-gdy-pada-deszcz.html': ['blog-termy.html', 'blog-krupowki.html', 'blog-gubalowka.html'],
  'blog-zakopane-z-dziecmi.html':       ['blog-dolina-koscieliska.html', 'blog-rowery.html', 'blog-termy.html'],
  'blog-plakat-150-lat-kenara.html':    ['blog-krupowki.html', 'blog-tadeusz-pawlowski.html', 'blog-gubalowka.html'],
  'blog-tadeusz-pawlowski.html':        ['blog-giewont.html', 'blog-morskie-oko.html', 'blog-kasprowy-wierch.html'],
  'blog-narty-zakopane.html':           ['blog-kasprowy-wierch.html', 'blog-gubalowka.html', 'blog-komunikacja.html'],
  'blog-kasprowy-wierch.html':          ['blog-morskie-oko.html', 'blog-giewont.html', 'blog-komunikacja.html'],
  'blog-krupowki.html':                 ['blog-gubalowka.html', 'blog-komunikacja.html', 'blog-zakopane-gdy-pada-deszcz.html'],
  'blog-gubalowka.html':                ['blog-krupowki.html', 'blog-kasprowy-wierch.html', 'blog-zakopane-z-dziecmi.html'],
  'blog-komunikacja.html':              ['blog-morskie-oko.html', 'blog-kasprowy-wierch.html', 'blog-jak-dojechac.html'],
  'blog-rowery.html':                   ['blog-dolina-koscieliska.html', 'blog-morskie-oko.html', 'blog-komunikacja.html'],
  'blog-skywalk.html':                  ['blog-gubalowka.html', 'blog-morskie-oko.html', 'blog-komunikacja.html'],
  'blog-wielkanocne-jajo.html':         ['blog-narty-zakopane.html', 'blog-kasprowy-wierch.html', 'blog-krupowki.html'],
  'blog-termy.html':                    ['blog-zakopane-gdy-pada-deszcz.html', 'blog-zakopane-z-dziecmi.html', 'blog-kasprowy-wierch.html'],
  'blog-morskie-oko.html':              ['blog-komunikacja.html', 'blog-kasprowy-wierch.html', 'blog-rowery.html'],
  'blog-dolina-koscieliska.html':       ['blog-rowery.html', 'blog-morskie-oko.html', 'blog-zakopane-z-dziecmi.html'],
  'blog-giewont.html':                  ['blog-kasprowy-wierch.html', 'blog-morskie-oko.html', 'blog-gubalowka.html'],
  'blog-jak-dojechac.html':             ['blog-komunikacja.html', 'blog-morskie-oko.html', 'blog-kasprowy-wierch.html'],
};

const STYL = `
<style>
  .zobacz-tez { margin: 3rem 0 2rem; padding-top: 2rem; border-top: 1px solid rgba(30,42,30,0.12); }
  .zobacz-tez h2 { font-family:'Playfair Display', serif; font-size:1.5rem; font-weight:400; color:var(--dark); margin-bottom:1.2rem; }
  .zobacz-tez ul { list-style:none; margin:0; padding:0; display:grid; gap:0.7rem; }
  .zobacz-tez li { margin:0; display:flex; }
  .zobacz-tez a {
    display:flex; flex:1; flex-direction:column; gap:0.15rem;
    padding:0.9rem 1.1rem;
    background:#fff; border:1px solid rgba(30,42,30,0.12); border-radius:10px;
    text-decoration:none; transition:border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .zobacz-tez a:hover { border-color:var(--forest); transform:translateY(-2px); box-shadow:0 6px 18px rgba(30,42,30,0.10); }
  .zobacz-tez a:focus-visible { outline:3px solid var(--forest); outline-offset:3px; }
  .zobacz-tez .zt-tytul { font-weight:700; color:var(--forest); font-size:1rem; }
  .zobacz-tez .zt-opis { font-size:0.85rem; color:var(--text-mid); }
  @media (min-width: 700px) { .zobacz-tez ul { grid-template-columns: repeat(3, 1fr); } }
</style>`;

function zbudujBlok(cele) {
  const pozycje = cele.map(cel => {
    const wpis = WPISY[cel];
    if (!wpis) throw new Error('brak opisu dla ' + cel);
    return `      <li><a href="${cel}">
        <span class="zt-tytul">${wpis[0]}</span>
        <span class="zt-opis">${wpis[1]}</span>
      </a></li>`;
  }).join('\n');

  return `  <aside class="zobacz-tez">
    <h2>Zobacz też</h2>
    <ul>
${pozycje}
    </ul>
  </aside>
${STYL}

`;
}

let zmienione = 0, pominiete = 0;

for (const [plik, cele] of Object.entries(POWIAZANIA)) {
  // artykuly zwykle siedza w src/, sierota jak-dojechac tylko w katalogu glownym
  const wSrc  = path.join(SRC_DIR, plik);
  const sciezka = fs.existsSync(wSrc) ? wSrc : path.join(ROOT, plik);

  if (!fs.existsSync(sciezka)) {
    console.warn(`  ⚠  nie znaleziono ${plik}`);
    continue;
  }

  let html = fs.readFileSync(sciezka, 'utf8');

  if (html.includes('class="zobacz-tez"')) {
    console.log(`  ⏭  ${plik} – blok już jest`);
    pominiete++;
    continue;
  }

  const kotwica = '  <a href="blog.html" class="back-btn">';
  if (!html.includes(kotwica)) {
    console.warn(`  ⚠  ${plik} – nie znalazłem miejsca wstawienia`);
    continue;
  }

  html = html.replace(kotwica, zbudujBlok(cele) + kotwica);
  fs.writeFileSync(sciezka, html, 'utf8');
  console.log(`  ✓  ${plik} → ${cele.map(c => c.replace('blog-', '').replace('.html', '')).join(', ')}`);
  zmienione++;
}

// Ile linkow przychodzacych dostala kazda strona
const przychodzace = {};
Object.values(POWIAZANIA).flat().forEach(c => { przychodzace[c] = (przychodzace[c] || 0) + 1; });

console.log(`\nZmienione: ${zmienione}, pominięte: ${pominiete}`);
console.log('\nLinki przychodzące (z samych sekcji "Zobacz też"):');
Object.entries(przychodzace)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cel, ile]) => console.log(`  ${String(ile).padStart(2)} ← ${cel}`));
