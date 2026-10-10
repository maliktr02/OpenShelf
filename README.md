# <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'/%3E%3Cpath d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'/%3E%3C/svg%3E" width="28" height="28" alt=""> OpenShelf

**OpenShelf** is a local-first, open-source digital bookshelf. Catalogue your personal library — titles, authors, languages, ratings and prices — in a polished, book-themed interface that runs entirely in your browser.

No build step. No server. No tracking. Just open the app.

> **Status:** v2.0.0 — a full rewrite of the original prototype into a modular, dependency-free static web app.

---

## Features

### Your library, richly catalogued
- **Multi-language titles** — one main title plus any number of per-language title translations.
- **Detailed authors** — name, birth year, death year and ethnicity.
- **Reading metadata** — page count, literary language, rating and personal notes.
- **Prices that make sense** — pick a currency when you enter a price and OpenShelf converts it to your chosen base currency in real time (a book entered as `25 TRY` shows its true value in `USD`, not a mislabelled `25 USD`).
- **Optional cover photos** — add a front and/or spine image for each book.

### A shelf that looks like a shelf
- **Three view modes** — cover grid, a bookshelf of spines, or a compact list table.
- **Configurable card size and density**, so the shelf fits the way you like.
- **Book-themed design** — layered gradients, subtle motion, elegant display typography, and a startup animation.
- **Date & local time** shown in the top bar.
- **Proper iconography** — crisp Lucide line icons instead of emoji.

### Powerful discovery
- **Detailed filtering & sorting** by title, author, language, rating, price and more.
- **A comprehensive statistics panel** — totals, averages, language and author breakdowns, rating distribution and estimated collection value.

### Make it yours
- **20 interface languages**, including right-to-left Arabic and Persian.
- **Multiple themes** — light, dark, sepia and follow-system.
- **Accent colour presets**, font choice, animation toggle and card layout controls — all under an extensive Settings panel.

### Private by design
- All data stays on your device using **`localStorage`**.
- **Export / import** your library as JSON at any time.
- Optional **data folder sync** (Chromium browsers) writes `books.json` and `settings.json` to a folder you choose — a portable, human-readable backup that never leaves your machine.

---

## Getting started

OpenShelf is a static site. There is nothing to install and no backend to run.

### Run it

1. Download or clone the repository:
   ```bash
   git clone https://github.com/maliktr02/OpenShelf.git
   ```
2. Open **`index.html`** in a modern browser (Chrome, Edge, Firefox or Safari).

That's it. You can also serve the folder with any static file server if you prefer, but it isn't required:

```bash
# optional, any static server works
npx serve .
```

### First steps

1. Click **Add book** to catalogue your first title.
2. Open **Settings** to choose your interface language, base currency, theme and layout.
3. Use **Export** to save a JSON backup, and **Import** to restore it on another device.

> **Offline note:** live currency rates are fetched from a public endpoint when available; bundled fallback rates keep conversion working with no connection.

---

## Project structure

```
OpenShelf/
├── index.html              # App shell: top bar, toolbar, views, modals
├── css/
│   ├── base.css            # Design tokens, themes, typography, animations
│   ├── layout.css          # Top bar, toolbar, shelf layouts, responsiveness
│   └── components.css      # Cards, buttons, forms, modals, statistics
├── js/
│   ├── config.js           # Languages, currencies, themes, storage keys
│   ├── i18n.js             # Translation engine (+ embedded English)
│   ├── models.js           # Book model and validation
│   ├── currency.js         # Conversion, formatting and display
│   ├── store.js            # localStorage + optional data-folder sync
│   ├── ui.js               # Rendering, filtering, sorting, statistics
│   └── app.js              # App controller, modals, forms, events
├── locales/                # One <code>.js file per interface language
├── data/                   # Local user data (git-ignored) + folder docs
│   └── README.md           # Notes on the data folder
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

User data is **not** part of the repository — `data/*.json`, `data/backups/` and `data/covers/` are git-ignored. Translation files under `locales/` are tracked.

---

## Localisation

Interface strings live in `locales/<code>.js`. Each file self-registers with the translation engine:

```js
I18N.register('de', {
  'app.tagline': 'Dein lokaler digitaler Bücherschrank',
  // …
});
```

Adding a language is as simple as dropping in a new file and listing its code in `js/config.js`. See [`data/README.md`](data/README.md) for details. The name **OpenShelf** is intentionally kept identical in every language.

Included interface languages: English, Turkish, German, French, Spanish, Italian, Portuguese, Russian, Arabic, Persian, Hindi, Chinese, Japanese, Korean, Dutch, Polish, Ukrainian, Indonesian, Greek and Swedish.

---

## Contributing

Contributions are welcome — bug reports, translations, design polish and code. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request.

---

## Credits

- **Creator / Developer:** [maliktr02](https://github.com/maliktr02)
- **Repository:** https://github.com/maliktr02/OpenShelf

These credits also appear inside the app's **Info** panel.

---

## License

Released under the [MIT License](LICENSE).
