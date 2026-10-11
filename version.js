/* ─────────────────────────────────────────────────────────────
 * OpenShelf — version.js
 * The single source of truth for every piece of version metadata.
 * Nothing elsewhere in the app may hard-code a version string:
 * `js/config.js` spreads this object into OPEN_SHELF, and the
 * interface reads it through the `Version` helper below.
 *
 * Keeping it as a plain script (not JSON) means it also loads over
 * file://, where fetch() of a .json file would be blocked.
 * ───────────────────────────────────────────────────────────── */
const OPEN_SHELF_VERSION = {
  name: 'OpenShelf',
  version: '2.2.0',
  codename: 'Folio',
  releaseDate: '2026-10-11',
  /* Increment when the exported data shape changes. */
  schemaVersion: 2,
  repository: 'https://github.com/maliktr02/OpenShelf',
  repositoryLabel: 'github.com/maliktr02/OpenShelf',
  creator: 'maliktr02',
  creatorUrl: 'https://github.com/maliktr02',
  license: 'MIT',

  /* Newest first. Rendered in the app's Info panel. */
  changelog: [
    {
      version: '2.2.0',
      codename: 'Folio',
      date: '2026-10-11',
      changes: []
    },
    {
      version: '2.1.0',
      codename: 'Bindery',
      date: '2026-10-10',
      changes: []
    },
    {
      version: '2.0.0',
      codename: 'Rebind',
      date: '2026-10-10',
      changes: []
    }
  ]
};

/* Small helper so the rest of the app never parses versions by hand. */
const Version = {
  meta: OPEN_SHELF_VERSION,

  get number() { return OPEN_SHELF_VERSION.version; },
  get codename() { return OPEN_SHELF_VERSION.codename; },
  get releaseDate() { return OPEN_SHELF_VERSION.releaseDate; },
  get schema() { return OPEN_SHELF_VERSION.schemaVersion; },

  /** "OpenShelf v2.2.0" */
  label() { return `${OPEN_SHELF_VERSION.name} v${OPEN_SHELF_VERSION.version}`; },

  /** "2.2.0 (Folio)" */
  full() { return `${OPEN_SHELF_VERSION.version} (${OPEN_SHELF_VERSION.codename})`; },

  /** Parses "a.b.c" into numbers for comparison. */
  parse(str) {
    return String(str || '0').split('.').map((n) => parseInt(n, 10) || 0);
  },

  /** Returns -1, 0 or 1 comparing two semver-ish strings. */
  compare(a, b) {
    const x = this.parse(a), y = this.parse(b);
    for (let i = 0; i < Math.max(x.length, y.length); i++) {
      const d = (x[i] || 0) - (y[i] || 0);
      if (d) return d < 0 ? -1 : 1;
    }
    return 0;
  },

  isNewer(a, b) { return this.compare(a, b) > 0; },

  /** The most recent changelog entry. */
  latest() { return (OPEN_SHELF_VERSION.changelog || [])[0] || null; }
};

window.OPEN_SHELF_VERSION = OPEN_SHELF_VERSION;
window.Version = Version;
