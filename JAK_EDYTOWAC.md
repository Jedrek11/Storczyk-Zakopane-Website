# Jak edytować stronę Willi Storczyk

## Szybki start

```bash
npm run watch        # Uruchom auto-rebuild (buduje przy każdym zapisie)
# Edytuj pliki w src/ lub partials/ → strona przebudowuje się automatycznie
# Ctrl+C aby zatrzymać
```

## Struktura plików

```
src/               ← szablony stron (treść)
  index.html, blog.html, blog-*.html, regulamin.html

partials/          ← wspólne elementy (menu, nawigacja)
  mobile-menu-index.html    — menu na stronie głównej
  mobile-menu-blog.html     — menu na stronach bloga
  mobile-menu-styles.html   — style CSS menu
  mobile-topbar.html        — górny pasek (blog)
  bottom-nav-index.html     — dolna nawigacja (strona główna)
  bottom-nav-blog.html      — dolna nawigacja (blog i artykuły)
  bottom-nav-regulamin.html — dolna nawigacja (regulamin)

assets/css/main.css  ← główne style strony
assets/js/main.js    ← cały JavaScript strony

config.json          ← dane kontaktowe, URL-e (używane w szablonach jako {{contact.phoneMobile}} itp.)

scripts/             ← narzędzia
  build.js           — buduje strony z src/ + partials/ + config.json
  watch.js           — auto-rebuild przy zmianach
  new-blog.js        — generator nowych artykułów blogowych
```

## Jak zmienić wspólny element (np. menu)

1. Edytuj odpowiedni plik w `partials/`
2. Uruchom build:
   ```bash
   npm run build
   ```

## Jak zmienić treść strony (np. tekst artykułu)

1. Edytuj plik w `src/` (np. `src/blog-kasprowy-wierch.html`)
2. Uruchom build:
   ```bash
   npm run build
   ```

## Jak zmienić style lub JavaScript

- **CSS:** edytuj `assets/css/main.css`
- **JS:** edytuj `assets/js/main.js`
- Nie trzeba buildu — te pliki są ładowane bezpośrednio

## Jak zmienić dane kontaktowe

Edytuj `config.json` — build automatycznie podmieni wartości `{{contact.phoneMobile}}`, `{{urls.baseUrl}}` itp. we wszystkich stronach.

## Jak dodać nowy artykuł blogowy

### Najprościej: Studio wpisów (klikany panel) ⭐

1. Kliknij dwa razy plik **`Studio-Wpisow.bat`** (w głównym folderze).
2. W przeglądarce otworzy się panel — wypełnij pola, przeciągnij zdjęcia,
   dodaj treść klockami (nagłówek, akapit, wskazówka, FAQ, zdjęcie).
3. Po prawej masz **podgląd na żywo** — dokładnie tak, jak wpis będzie wyglądał.
4. Klikasz **„Zapisz wpis"** (tworzy się lokalnie) i sprawdzasz podgląd.
5. Klikasz **„Opublikuj na stronę"** — wpis leci na GitHub, a Netlify
   odświeża stronę w 1–2 minuty. Gotowe.

Panel sam robi wszystko: plik wpisu, kartę na liście bloga, wpis do
`sitemap.xml`, przekierowanie w `netlify.toml`, konwersję zdjęć do `.webp`
i przebudowę strony.

> W akapitach możesz używać `**pogrubienia**` oraz linków `[tekst](adres)`.

### Alternatywa: generator w terminalu

```bash
node scripts/new-blog.js
```

Tworzy szkielet wpisu, treść uzupełniasz potem ręcznie w pliku `src/`.

## WAŻNE

- **Nie edytuj plików .html w katalogu głównym** — są generowane automatycznie i zostaną nadpisane przy buildzie
- Edytuj zawsze w `src/` (treść) lub `partials/` (wspólne elementy)
- `assets/css/main.css` i `assets/js/main.js` edytuj bezpośrednio (nie są przetwarzane przez build)

## Wymagania

- Node.js >= 14 (https://nodejs.org)
- Brak zewnętrznych zależności (nie trzeba `npm install`)
