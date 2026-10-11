# `data/` — local user data

This folder is reserved for **your private library data**. Nothing here is committed to Git — see `.gitignore`.

OpenShelf stores your books in the browser's `localStorage` by default. If you enable **data folder sync** in Settings (Chromium browsers only), pick any folder on your disk and the app keeps its files inside a **`data/` subdirectory** of it:

- `books.json` — your catalogue
- `settings.json` — your preferences
- `meta.json` — app version, data schema version and a timestamp

A dedicated run may also create:

- `backups/` — timestamped exports
- `covers/` — cover images saved from the app
- `uploads/` — other imported assets

All of the above are **private** and git-ignored.

## Moving your library

Use **Export** / **Import** in the app, or copy the data folder between machines yourself. Since these are plain JSON files, you can also back them up with any sync tool.

> Looking for interface translations? They now live in [`../locales/`](../locales), outside this data folder.
