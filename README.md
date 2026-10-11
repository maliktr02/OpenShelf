# <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'/%3E%3Cpath d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'/%3E%3C/svg%3E" width="28" height="28" alt=""> OpenShelf

**OpenShelf** is a local-first, open-source digital bookshelf. Catalogue your personal library — titles, authors, languages, ratings and prices — in a polished, book-themed interface that runs entirely in your browser.

No build step. No server. No tracking. Just open the app.

> **Status:** v2.2.0 — a modular, dependency-free static web app with series tracking, tags, visual statistics, richly customisable quote cards and a single-source version system.

---

## Features

### Your library, richly catalogued
- **Multi-language titles** — one main title plus any number of per-language title translations.
- **Detailed authors** — name, birth year, death year and ethnicity.
- **Reading metadata** — page count, literary language, rating and personal notes.
- **Series tracking** — group volumes under a series name with a volume number, and see at a glance which volumes you own and which are missing.
- **Tags** — label books with any number of free-form tags and filter your shelf by them.
- **Quotes** — keep memorable lines for each book, separate from your notes.
- **Prices that make sense** — pick a currency when you enter a price and OpenShelf converts it to your chosen base currency in real time (a book entered as `25 TRY` shows its true value in `USD`, not a mislabelled `25 USD`).
- **Optional cover photos** — add a front and/or spine image for each book.

### A shelf that looks like a shelf
- **Four view modes** — cover grid, a bookshelf of spines (with volume labels), a **series view** that groups volumes with progress bars, or a compact list table.
- **Configurable card size and density**, so the shelf fits the way you like.
- **Shelf display preferences** — show or hide ratings, prices, tags, series and language on cards and list rows.
- **Book-themed design** — layered gradients, subtle motion, elegant display typography, and a polished animated startup screen that reports its progress.
- **Date & local time** shown in the top bar.
- **Proper iconography** — crisp Lucide line icons instead of emoji.

### Powerful discovery
- **Detailed filtering & sorting** by title, author, language, series, tag, rating, price and more.
- **A comprehensive statistics panel** with real charts: a rating bar chart, a language donut, an "added over time" area graph, per-series progress, a top-tags cloud and collection value.

### Share your reading
- **Quote cards** — turn any saved quote into a stylish image in **six styles** (Gradient, Paper, Night, Forest, Sunset, Minimal), **three formats** (square 1080×1080, portrait 1080×1350, story 1080×1920), two typefaces, left/centre alignment, a custom card colour, and optional title, author, branding and quote marks. Download it, copy it to the clipboard, or share it directly to social apps via the Web Share API.
- **Markdown export** — export the whole library (or a single book) to a clean Markdown document. Labels follow your selected interface language, so you can generate the same shelf in any of the 20 languages.

### Make it yours
- **20 interface languages**, each shown with its **country flag** so the choice is obvious at a glance — including right-to-left Arabic and Persian.
- **Multiple themes** — light, dark, sepia and follow-system.
- **Accent colour presets**, font choice, animation toggle, card layout and shelf-display controls — all under an extensive Settings panel.

### Private by design
- All data stays on your device using **`localStorage`**.
- **Export / import** your library as JSON at any time (with app version and schema metadata).
- **Markdown export** for a portable, human-readable copy of your catalogue.
- Optional **data folder sync** (Chromium browsers) keeps everything inside a `data/` subdirectory of a folder you choose — `books.json`, `settings.json` and `meta.json` form a portable, human-readable backup that never leaves your machine.

### Built to last
- **One version file** — every version number, the codename, release date, schema version and the changelog live in the root `version.js`; the app reads them everywhere, including the Info panel.
- **Data schema versioning** so backups remain compatible as the format evolves.

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
├── version.js              # Single source of truth for version metadata & changelog
├── css/
│   ├── base.css            # Design tokens, themes, typography, animations
│   ├── layout.css          # Top bar, toolbar, shelf layouts, responsiveness
│   └── components.css      # Cards, buttons, forms, modals, statistics
├── js/
│   ├── flags.js            # Inline SVG country flags for the language picker
│   ├── config.js           # Languages, currencies, themes, option lists
│   ├── i18n.js             # Translation engine (+ embedded English)
│   ├── models.js           # Book model and validation
│   ├── currency.js         # Conversion, formatting and display
│   ├── charts.js           # Dependency-free SVG charts (donut, bars, area)
│   ├── quotecard.js        # Canvas quote-card renderer (download/copy/share)
│   ├── markdown.js         # Markdown export (library and single book)
│   ├── store.js            # localStorage + optional data-folder sync
│   ├── ui.js               # Rendering, filtering, sorting, statistics
│   └── app.js              # App controller, modals, forms, events
├── locales/                # One <code>.js file per interface language
├── data/                   # Optional self-contained data folder (books.json, …)
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

Adding a language is as simple as dropping in a new file and listing its code in `js/config.js` (plus a flag in `js/flags.js`). See [`data/README.md`](data/README.md) for details. The name **OpenShelf** is intentionally kept identical in every language, and the interface-language picker shows each option with its country flag.

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
