/* ─────────────────────────────────────────────────────────────
 * OpenShelf — Book model
 * Normalises, validates and migrates every book record so the
 * rest of the app can rely on a stable shape.
 * ───────────────────────────────────────────────────────────── */
class Book {
  constructor(data = {}) {
    const title = data.title || {};
    const author = data.author || {};
    const price = data.price || {};
    const photos = data.photos || {};

    this.id = data.id || (crypto.randomUUID ? crypto.randomUUID() : Book._uuid());
    this.title = {
      main: String(title.main || '').trim(),
      translations: Book._cleanTranslations(title.translations)
    };
    this.author = {
      name: String(author.name || '').trim(),
      birthYear: author.birthYear !== undefined && author.birthYear !== '' ? parseInt(author.birthYear) || '' : '',
      deathYear: author.deathYear !== undefined && author.deathYear !== '' ? parseInt(author.deathYear) || '' : '',
      ethnicity: String(author.ethnicity || '').trim()
    };
    this.pageCount = parseInt(data.pageCount) || 0;
    this.language = String(data.language || '').trim();
    this.genre = String(data.genre || '').trim();
    this.price = {
      amount: data.price && data.price.amount !== '' && data.price.amount != null ? parseFloat(data.price.amount) || 0 : 0,
      currency: String(price.currency || 'USD').toUpperCase()
    };
    this.rating = Math.max(0, Math.min(5, parseInt(data.rating) || 0));
    this.notes = String(data.notes || '');
    this.photos = {
      front: String(photos.front || ''),
      spine: String(photos.spine || '')
    };
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || this.createdAt;
  }

  static _cleanTranslations(t) {
    if (!t || typeof t !== 'object') return {};
    const out = {};
    for (const [lang, text] of Object.entries(t)) {
      const key = String(lang || '').trim();
      const val = String(text || '').trim();
      if (key && val) out[key] = val;
    }
    return out;
  }

  static _uuid() {
    return 'book-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  /** Returns the title in the requested language, falling back to the main title. */
  titleFor(code) {
    return this.title.translations[code] || this.title.main;
  }

  /** A plain-object snapshot suitable for JSON export. */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      author: this.author,
      pageCount: this.pageCount,
      language: this.language,
      genre: this.genre,
      price: this.price,
      rating: this.rating,
      notes: this.notes,
      photos: this.photos,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /** True when the record satisfies the mandatory fields. */
  get isValid() {
    return this.title.main.length > 0 && this.author.name.length > 0 && this.pageCount > 0;
  }
}
