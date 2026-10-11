# Contributing to OpenShelf

Thanks for your interest in improving OpenShelf! This guide keeps contributions smooth and consistent.

## Ways to contribute

- **Report a bug** — open an issue with steps to reproduce, expected vs. actual behaviour, browser and OS.
- **Suggest a feature** — open an issue describing the use case before writing code.
- **Improve a translation** — see the localisation section below.
- **Submit code** — polish the UI, fix bugs, or add well-scoped features.

## Project principles

OpenShelf is deliberately simple to keep it easy to fork and host:

1. **Vanilla only.** No frameworks, no bundler, no build step. Plain HTML, CSS and ES modules-free scripts.
2. **Local-first.** User data never leaves the device. Anything networked must be optional and degrade gracefully.
3. **Single source of truth.** Shared state lives in `js/config.js`; every version number comes from the root `version.js`; keep concerns in their respective file.
4. **Accessible & responsive.** Keyboard navigation, ARIA labels and `data-i18n*` attributes on user-facing text.

## Project structure

```
OpenShelf/
├─ index.html          Single page shell (modals, forms, startup screen)
├─ version.js          Single source of truth for version metadata & changelog
├─ js/
│  ├─ flags.js         Inline SVG country flags for the language picker
│  ├─ config.js        Languages, currencies, themes, option lists
│  ├─ i18n.js          Translation engine + embedded English fallback
│  ├─ models.js        Book model (series, tags, quotes, …)
│  ├─ store.js         Persistence (localStorage + optional /data folder)
│  ├─ currency.js      Offline conversion rates
│  ├─ charts.js        Dependency-free SVG charts
│  ├─ quotecard.js     Canvas quote-card renderer
│  ├─ markdown.js      Markdown export
│  ├─ ui.js            Rendering, filtering, sorting, statistics
│  └─ app.js           Controller: events, modals, settings, data tools
├─ css/                base · layout · components
├─ locales/            One file per interface language
└─ data/               Optional self-contained data folder (books.json, …)
```

## Development setup

There is no installation step:

1. Clone the repository.
2. Open `index.html` in a modern browser.
3. Edit the files and refresh.

For quicker iteration you can serve the folder with any static server (e.g. `npx serve .`), but `file://` works too.

## Data & persistence

- The primary store is `localStorage`, so the app works over `file://` with no setup.
- On Chromium browsers the user may optionally connect a **data folder**. OpenShelf then keeps everything inside a `data/` subdirectory of that folder:
  - `books.json` — the library
  - `settings.json` — preferences
  - `meta.json` — app version, schema version and timestamp
- Backup/restore uses a single JSON file whose `version` and `schema` fields come from `version.js`. Bump `schemaVersion` there whenever the exported shape changes.

## Versioning

`version.js` is the only place a version string may live. It exposes `OPEN_SHELF_VERSION` (name, version, codename, release date, schema, repository, changelog) and a small `Version` helper (parse/compare/label). `js/config.js` spreads it into `OPEN_SHELF`, and the Info panel renders it. To release:

1. Bump `version` (semver) and `schemaVersion` (only if data shape changed) in `version.js`.
2. Add a new entry at the top of `changelog`.
3. Update the version badge in `README.md` if present.

## Code style

- **Indentation:** 2 spaces (see `.editorconfig`).
- **Endings:** LF, UTF-8, final newline.
- **JavaScript:** `const`/`let`, clear names, small functions. Run `node --check js/<file>.js` before committing.
- **CSS:** use the design tokens in `css/base.css` (`--accent`, `--surface`, etc.) instead of hard-coded colours; add new rules to the most relevant file.
- **HTML:** every user-facing string needs a `data-i18n`, `data-i18n-placeholder`, `data-i18n-title` or `data-i18n-aria` attribute.
- **Icons:** use Lucide names via `data-lucide="..."`. Do not add emoji. Flags are inline SVG in `js/flags.js`.

## Adding or editing a translation

1. Copy `locales/tr.js` (or read the embedded fallback in `js/i18n.js`) for the reference English key set.
2. Create `locales/<code>.js` that calls `I18N.register('<code>', { ... })`.
3. Cover **every** key in `I18N.en`. Missing keys silently fall back to English, which hides gaps, so verify parity across all locales:
   ```bash
   node -e "const fs=require('fs'),vm=require('vm');const c={window:null};c.window=c;c.document={documentElement:{setAttribute(){}},querySelectorAll(){return[]},createElement(){return{}}};vm.createContext(c);['version.js','js/flags.js','js/config.js','js/i18n.js'].forEach(f=>vm.runInContext(fs.readFileSync(f,'utf8'),c));const en=Object.keys(c.I18N.en);fs.readdirSync('locales').forEach(f=>{vm.runInContext(fs.readFileSync('locales/'+f,'utf8'),c);const d=c.I18N.cache[f.replace('.js','')]||{};const m=en.filter(k=>d[k]===undefined);console.log(f,m.length?'MISSING '+m.join(','):'OK')});"
   ```
4. New language? Add it to `uiLocales` in `js/config.js`, mark `rtl: true` for right-to-left scripts, and add a matching flag in `js/flags.js`.
5. Never translate the product name **OpenShelf**.

## Reporting issues

Include:

- What you did, what you expected, and what happened.
- Browser + version and OS.
- Console errors if any.
- A minimal exported library JSON if the bug is data-related (remove anything private first).

## Pull requests

1. Fork and create a branch: `git checkout -b fix/short-description`.
2. Keep changes focused and explain the reasoning in the PR description.
3. Confirm `node --check` passes on any changed JS file.
4. Link the related issue where applicable.

By contributing, you agree your work is released under the project's [MIT License](LICENSE).
