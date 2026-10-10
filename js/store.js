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
    sort: 'newest'
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
  static getSettings() {
    const raw = this._read(this.SETTINGS_KEY, {});
    return { ...this.DEFAULT_SETTINGS, ...(raw || {}) };
  }

  static saveSettings(settings) {
    return this._write(this.SETTINGS_KEY, settings);
  }

  static resetSettings() {
    this.saveSettings({ ...this.DEFAULT_SETTINGS });
    return { ...this.DEFAULT_SETTINGS };
  }

  /* ── Backup ── */
  static exportData() {
    return JSON.stringify({
      app: OPEN_SHELF.name,
      version: OPEN_SHELF.version,
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
        this.saveSettings({ ...this.DEFAULT_SETTINGS, ...data.settings });
      }
      return true;
    } catch (e) {
      console.error('OpenShelf: import failed', e);
      return false;
    }
  }

  /* ── Optional data-folder sync (File System Access API) ── */
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
    async _writeFile(dir, name, content) {
      const fileHandle = await dir.getFileHandle(name, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    },
    async save(books, settings) {
      const handle = await this.getHandle();
      if (!handle) return false;
      if (!(await this.ensurePermission(handle))) return false;
      await this._writeFile(handle, 'books.json', JSON.stringify(books.map((b) => (b instanceof Book ? b.toJSON() : b)), null, 2));
      await this._writeFile(handle, 'settings.json', JSON.stringify(settings, null, 2));
      return true;
    },
    async load() {
      const handle = await this.getHandle();
      if (!handle) return null;
      if (!(await this.ensurePermission(handle))) return null;
      const result = {};
      try {
        const booksFile = await handle.getFileHandle('books.json');
        result.books = JSON.parse(await (await booksFile.getFile()).text());
      } catch (e) { /* no books file yet */ }
      try {
        const settingsFile = await handle.getFileHandle('settings.json');
        result.settings = JSON.parse(await (await settingsFile.getFile()).text());
      } catch (e) { /* no settings file yet */ }
      return result;
    }
  };
}
