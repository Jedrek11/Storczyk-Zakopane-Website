# Jak edytować wspólne elementy strony

## Struktura

```
partials/          ← TUTAJ edytujesz wspólne elementy
  mobile-menu-index.html    — menu na stronie głównej
  mobile-menu-blog.html     — menu na stronach bloga
  mobile-menu-css.html      — style CSS menu (blogi)
  mobile-topbar.html        — górny pasek na stronach bloga
  bottom-nav-index.html     — dolna nawigacja (strona główna)
  bottom-nav-blog.html      — dolna nawigacja (blog i artykuły)
  bottom-nav-regulamin.html — dolna nawigacja (regulamin)

src/               ← szablony stron (NIE edytuj bezpośrednio .html w katalogu głównym)
  index.html, blog.html, blog-*.html, regulamin.html

build.js           ← skrypt składający strony
watch.js           ← automatyczne budowanie przy zmianach
```

## Jak zmienić wspólny element (np. menu)

1. Edytuj odpowiedni plik w folderze `partials/`
2. Uruchom build:
   ```
   node build.js
   ```
3. Gotowe — wszystkie strony zostały zaktualizowane!

## Jak zmienić treść konkretnej strony (np. tekst artykułu)

1. Edytuj plik w folderze `src/` (np. `src/blog-kasprowy-wierch.html`)
2. Uruchom build:
   ```
   node build.js
   ```

## Tryb automatyczny (watch)

Zamiast ręcznie uruchamiać `node build.js` po każdej zmianie,
możesz uruchomić tryb watch — buduje automatycznie przy każdym zapisie:

```
node watch.js
```

Ctrl+C aby zatrzymać.

## Wymagania

- Node.js (https://nodejs.org) — wersja 14 lub nowsza
- Nie są potrzebne żadne dodatkowe pakiety (npm install nie jest wymagane)

## WAŻNE

- **Nie edytuj bezpośrednio plików .html w katalogu głównym** — są one generowane automatycznie
  przez `build.js` i zostaną nadpisane przy następnym buildzie
- Edytuj zawsze w `src/` (treść strony) lub `partials/` (wspólne elementy)
