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
3. **Modular.** Shared state lives in `js/config.js`; keep concerns in their respective file.
4. **Accessible & responsive.** Keyboard navigation, ARIA labels and `data-i18n*` attributes on user-facing text.

## Development setup

There is no installation step:

1. Clone the repository.
2. Open `index.html` in a modern browser.
3. Edit the files and refresh.

For quicker iteration you can serve the folder with any static server (e.g. `npx serve .`), but `file://` works too.

## Code style

- **Indentation:** 2 spaces (see `.editorconfig`).
- **Endings:** LF, UTF-8, final newline.
- **JavaScript:** `const`/`let`, clear names, small functions. Run `node --check js/<file>.js` before committing.
- **CSS:** use the design tokens in `css/base.css` (`--accent`, `--surface`, etc.) instead of hard-coded colours; add new rules to the most relevant file.
- **HTML:** every user-facing string needs a `data-i18n`, `data-i18n-placeholder`, `data-i18n-title` or `data-i18n-aria` attribute.
- **Icons:** use Lucide names via `data-lucide="..."`. Do not add emoji.

## Adding or editing a translation

1. Copy `locales/tr.js` (or view `js/i18n.js`) for the reference English key set.
2. Create `locales/<code>.js` that calls `I18N.register('<code>', { ... })`.
3. Cover every key. Verify parity:
   ```bash
   node -e "const en=Object.keys(require('./js/i18n.js')); console.log(en.length)"
   ```
4. If it is a new language, add it to `uiLocales` in `js/config.js` and mark `rtl: true` for right-to-left scripts.
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
