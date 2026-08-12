/**
 * Kontrola formularza rezerwacyjnego przed wdrozeniem.
 * Uzycie: node scripts/check-form.js   (uruchamiaj PO node scripts/build.js)
 *
 * Powstal po awarii, w ktorej main.js wymagal tokenu reCAPTCHA nieobecnej
 * na stronie i formularz odrzucal kazde zapytanie. Nikt tego nie zauwazyl,
 * bo zepsuty formularz wyglada tak samo jak brak zapytan.
 *
 * CZEGO TEN SKRYPT NIE SPRAWDZA: czy Netlify faktycznie przyjmuje wysylke.
 * Tego dowodzi wylacznie prawdziwe zapytanie wyslane z zywej strony.
 */

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const ROOT     = path.join(__dirname, '..');
const MANIFEST = path.join(__dirname, 'asset-versions.json');

const bledy = [];
const ostrzezenia = [];
const ok = [];

function czytaj(wzgledna) {
  const p = path.join(ROOT, wzgledna);
  if (!fs.existsSync(p)) {
    bledy.push(`brak pliku ${wzgledna}`);
    return null;
  }
  return fs.readFileSync(p, 'utf8');
}

function sprawdz(warunek, opisOk, opisBlad) {
  if (warunek) ok.push(opisOk);
  else bledy.push(opisBlad);
}

const src   = czytaj('src/index.html');
const build = czytaj('index.html');
const js    = czytaj('assets/js/main.js');

if (src && build && js) {

  // ── 1. Czy Netlify ma po czym rozpoznac formularz ──────────────
  sprawdz(/data-netlify\s*=\s*"true"/.test(src),
    'src/index.html: jest data-netlify="true"',
    'src/index.html: BRAK data-netlify="true" – Netlify nie zarejestruje formularza przy wdrozeniu');

  sprawdz(/name\s*=\s*"kontakt"/.test(src),
    'src/index.html: formularz nazywa sie "kontakt"',
    'src/index.html: BRAK name="kontakt" – zgloszenia trafia do innego formularza albo donikad');

  sprawdz(/data-netlify-honeypot\s*=\s*"bot-field"/.test(src) && /name\s*=\s*"bot-field"/.test(src),
    'src/index.html: honeypot bot-field na miejscu',
    'src/index.html: BRAK honeypotu bot-field – jedyna ochrona przed spamem znika');

  sprawdz(/<input[^>]+name="form-name"[^>]+value="kontakt"/.test(build),
    'index.html: ukryte pole form-name=kontakt jest w zbudowanym HTML',
    'index.html: BRAK ukrytego pola form-name – Netlify odrzuci POST');

  // ── 2. Czy pola, ktorych pilnuje JS, faktycznie istnieja ───────
  ['booking-form', 'imie', 'email', 'przyjazd', 'wyjazd', 'osoby', 'wiadomosc',
   'form-success', 'form-error'].forEach(id => {
    sprawdz(new RegExp(`id="${id}"`).test(build),
      `index.html: jest #${id}`,
      `index.html: BRAK elementu #${id}, a main.js sie do niego odwoluje`);
  });

  // ── 3. Pulapki, na ktore juz raz wpadlismy ─────────────────────
  sprawdz(!/\{\{[a-zA-Z_.]+\}\}/.test(js),
    'main.js: brak nierozwinietych znacznikow {{...}}',
    'main.js: zostal znacznik {{...}} – ten plik NIE przechodzi przez build.js, wpisuj wartosci na sztywno');

  sprawdz(/odpowiedz\.ok|response\.ok|res\.ok/.test(js),
    'main.js: sprawdza status odpowiedzi serwera',
    'main.js: NIE sprawdza response.ok – przy odpowiedzi 404/500 Gosc zobaczy "Dziekujemy", a zapytanie nigdzie nie dotrze');

  const wymagaCaptchy = /isRecaptchaVerified/.test(js);
  const maWidgetCaptchy = /data-netlify-recaptcha|g-recaptcha/.test(build);
  const captchaWarunkowa = /if\s*\(\s*!captchaWrapper\s*&&\s*!tokenField/.test(js);
  if (wymagaCaptchy && !maWidgetCaptchy) {
    sprawdz(captchaWarunkowa,
      'main.js: sprawdzanie captchy jest warunkowe, a widgetu nie ma – w porzadku',
      'main.js: wymaga captchy, ktorej NIE MA na stronie – formularz odrzuci kazde zapytanie (to byla awaria z 30.07.2026)');
  }

  sprawdz(/wiadomosc/.test(js) && !/messageInput\.value\.trim\(\)\.length\s*<\s*10\s*\)/.test(js.replace(/trescWiadomosci[\s\S]{0,120}/, '')),
    'main.js: wiadomosc nie jest polem obowiazkowym',
    'main.js: wiadomosc znowu jest wymagana – to niepotrzebne tarcie przy pierwszym kontakcie');

  // ── 4. Cache: /assets/* leci z Cache-Control immutable na rok ──
  const wersje = {};
  ['assets/css/main.css', 'assets/js/main.js'].forEach(plik => {
    const tresc = czytaj(plik);
    if (tresc === null) return;
    const hash = crypto.createHash('sha1').update(tresc).digest('hex').slice(0, 12);
    const nazwa = path.basename(plik);
    const dop = build.match(new RegExp(nazwa.replace('.', '\\.') + '\\?v=([0-9a-z]+)'));
    const wersja = dop ? dop[1] : null;
    wersje[plik] = { hash, wersja };

    sprawdz(wersja !== null,
      `index.html: ${nazwa} ma parametr ?v=`,
      `index.html: ${nazwa} BEZ ?v= – powracajacy Goscie dostana stara wersje z cache (immutable, rok)`);
  });

  if (fs.existsSync(MANIFEST)) {
    const poprzednie = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
    Object.entries(wersje).forEach(([plik, teraz]) => {
      const bylo = poprzednie[plik];
      if (!bylo) return;
      if (bylo.hash !== teraz.hash && bylo.wersja === teraz.wersja) {
        bledy.push(`${plik}: tresc sie zmienila, ale ?v=${teraz.wersja} zostalo takie samo – podbij wersje w src/index.html, inaczej powracajacy Goscie zostana na starym pliku`);
      } else if (bylo.hash !== teraz.hash) {
        ok.push(`${plik}: tresc zmieniona, wersja podbita na ?v=${teraz.wersja}`);
      }
    });
  } else {
    ostrzezenia.push('brak scripts/asset-versions.json – zapisuje stan wyjsciowy, kontrola wersji zadziala od nastepnego uruchomienia');
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(wersje, null, 2) + '\n', 'utf8');
}

// ── Wynik ────────────────────────────────────────────────────────
console.log(`\nKontrola formularza rezerwacyjnego\n${'='.repeat(38)}`);
ok.forEach(t => console.log(`  ✓  ${t}`));
ostrzezenia.forEach(t => console.log(`  !  ${t}`));

if (bledy.length) {
  console.log('');
  bledy.forEach(t => console.log(`  ✗  ${t}`));
  console.log(`\n❌ ${bledy.length} problem(ow). NIE wdrazaj, dopoki tego nie naprawisz.\n`);
  process.exit(1);
}

console.log(`\n✅ Formularz w porzadku (${ok.length} sprawdzen).`);
console.log('   Uwaga: to nie dowodzi, ze Netlify przyjmuje wysylke.');
console.log('   Po zmianach w sekcji rezerwacji wyslij jedno prawdziwe zapytanie z telefonu.\n');
