/* ─────────────────────────────────────────────────────────────
 * OpenShelf — Store
 * Primary persistence is localStorage (always available, even on
 * file://). An optional Chromium-only "data folder" sync writes
 * books.json / settings.json into a folder the user chooses.
 * ───────────────────────────────────────────────────────────── */
const IDB = {
  _db: null,
  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('openshelf-store', 1);
      req.onupgradeneeded = () => { req.result.createObjectStore('kv'); };
      req.onsuccess = () => { this._db = req.result; resolve(req.result); };
      req.onerror = () => reject(req.error);
    });
  },
  async set(key, val) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(val, key);
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  },
  async get(key) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const tx = db.transaction('kv', 'readonly');
      const r = tx.objectStore('kv').get(key);
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
  },
  async del(key) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').delete(key);
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  }
};

class Store {
  static BOOKS_KEY = OPEN_SHELF.storageKeys.books;
  static SETTINGS_KEY = OPEN_SHELF.storageKeys.settings;

  static DEFAULT_SETTINGS = {
    theme: 'light',
    accent: '#6366f1',
    view: 'grid',
    uiLang: 'en',
    baseCurrency: 'USD',
    cardSize: 'normal',
    density: 'comfortable',
    animations: true,
    font: 'sans',
    sort: 'newest',
    /* Which optional details appear on cards / list rows. */
    display: { rating: true, price: true, tags: true, series: true, language: true },
    /* Remembered quote-card personalisation. */
    quote: {
      style: 'gradient', format: 'square', font: 'serif',
      align: 'left', accent: '',
      showTitle: true, showAuthor: true, showBranding: true, showMarks: true
    }
  };

  static _read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error('OpenShelf: failed to read', key, e);
      return fallback;
    }
  }

  static _write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('OpenShelf: failed to write', key, e);
      return false;
    }
  }

  /* ── Books ── */
  static getBooks() {
    const raw = this._read(this.BOOKS_KEY, []);
    return Array.isArray(raw) ? raw : [];
  }

  static saveBooks(books) {
    return this._write(this.BOOKS_KEY, books.map((b) => (b instanceof Book ? b.toJSON() : b)));
  }

  /* ── Settings ── */
  static mergeSettings(raw) {
    const s = { ...this.DEFAULT_SETTINGS, ...(raw || {}) };
    s.display = { ...this.DEFAULT_SETTINGS.display, ...((raw && raw.display) || {}) };
    s.quote = { ...this.DEFAULT_SETTINGS.quote, ...((raw && raw.quote) || {}) };
    return s;
  }

  static getSettings() {
    return this.mergeSettings(this._read(this.SETTINGS_KEY, {}));
  }

  static saveSettings(settings) {
    return this._write(this.SETTINGS_KEY, settings);
  }

  static resetSettings() {
    const fresh = this.mergeSettings({});
    this.saveSettings(fresh);
    return fresh;
  }

  /* ── Backup ── */
  static exportData() {
    return JSON.stringify({
      app: OPEN_SHELF.name,
      version: OPEN_SHELF.version,
      codename: OPEN_SHELF.codename,
      schema: OPEN_SHELF.schemaVersion,
      exportedAt: new Date().toISOString(),
      books: this.getBooks(),
      settings: this.getSettings()
    }, null, 2);
  }

  static importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !Array.isArray(data.books)) return false;
      this.saveBooks(data.books);
      if (data.settings && typeof data.settings === 'object') {
        this.saveSettings(this.mergeSettings(data.settings));
      }
      return true;
    } catch (e) {
      console.error('OpenShelf: import failed', e);
      return false;
    }
  }

  /* ── Optional data-folder sync (File System Access API) ──
   * Everything the app persists is written inside a `data/`
   * subdirectory of the folder you pick, so an OpenShelf install is
   * self-contained and portable. */
  static DATA_DIR = 'data';

  static DataFolder = {
    supported() {
      return typeof window.showDirectoryPicker === 'function';
    },
    async pick() {
      const handle = await window.showDirectoryPicker({ id: 'openshelf', mode: 'readwrite' });
      await IDB.set('dirHandle', handle);
      return handle;
    },
    getHandle() { return IDB.get('dirHandle'); },
    async clear() { return IDB.del('dirHandle'); },
    async ensurePermission(handle, mode = 'readwrite') {
      const opts = { mode };
      if ((await handle.queryPermission(opts)) === 'granted') return true;
      if ((await handle.requestPermission(opts)) === 'granted') return true;
      return false;
    },
    /** Resolves the `data/` subdirectory inside the picked folder. */
    async _dataDir(create = true) {
      const root = await this.getHandle();
      if (!root) return null;
      if (!(await this.ensurePermission(root))) return null;
      return root.getDirectoryHandle(Store.DATA_DIR, { create });
    },
    async _writeFile(dir, name, content) {
      const fileHandle = await dir.getFileHandle(name, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    },
    async save(books, settings) {
      const dir = await this._dataDir(true);
      if (!dir) return false;
      const list = books.map((b) => (b instanceof Book ? b.toJSON() : b));
      await this._writeFile(dir, 'books.json', JSON.stringify(list, null, 2));
      await this._writeFile(dir, 'settings.json', JSON.stringify(settings, null, 2));
      await this._writeFile(dir, 'meta.json', JSON.stringify({
        app: OPEN_SHELF.name,
        version: OPEN_SHELF.version,
        codename: OPEN_SHELF.codename,
        schema: OPEN_SHELF.schemaVersion,
        updatedAt: new Date().toISOString(),
        bookCount: list.length
      }, null, 2));
      return true;
    },
    async load() {
      const dir = await this._dataDir(false);
      if (!dir) return null;
      const result = {};
      try {
        const booksFile = await dir.getFileHandle('books.json');
        result.books = JSON.parse(await (await booksFile.getFile()).text());
      } catch (e) { /* no books file yet */ }
      try {
        const settingsFile = await dir.getFileHandle('settings.json');
        result.settings = JSON.parse(await (await settingsFile.getFile()).text());
      } catch (e) { /* no settings file yet */ }
      return result;
    }
  };
}
