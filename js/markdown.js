/* ─────────────────────────────────────────────────────────────
 * OpenShelf — Markdown export
 * Renders the whole library (or a single book) to Markdown using
 * the labels of the *currently selected interface language*, so
 * the same shelf can be exported in any of OpenShelf's languages.
 * ───────────────────────────────────────────────────────────── */
const Markdown = {
  t(key) { return I18N.t(key); },

  _mdText(s) {
    return String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\r?\n+/g, ' ').trim();
  },

  _stars(rating) {
    const r = Math.max(0, Math.min(5, parseInt(rating) || 0));
    return r ? '★'.repeat(r) + '☆'.repeat(5 - r) : '—';
  },

  _price(book, base) {
    if (!book.price || book.price.amount <= 0) return '';
    const info = CurrencyService.display(book.price.amount, book.price.currency, base);
    if (!info) return '';
    return info.converted && info.original ? `${info.text} (${info.original})` : info.text;
  },

  _author(book) {
    const { name, birthYear, deathYear } = book.author;
    let years = '';
    if (birthYear) years = ` (${birthYear}${deathYear ? '–' + deathYear : ''})`;
    return `${name}${years}`;
  },

  _bookBlock(book, index, base) {
    const L = [];
    L.push(`### ${index}. ${this._mdText(book.title.main)} — ${this._mdText(book.author.name || '—')}`);
    L.push('');
    const rows = [];
    if (book.author.birthYear || book.author.deathYear || book.author.ethnicity) {
      rows.push([this.t('section.author'), this._mdText(this._author(book)) + (book.author.ethnicity ? ` · ${this._mdText(book.author.ethnicity)}` : '')]);
    }
    if (book.hasSeries) {
      rows.push([this.t('section.series'), this._mdText(book.series.name) + (book.series.volume ? ` — ${this.t('series.volumeN')} ${book.series.volume}` : '')]);
    }
    if (book.tags.length) rows.push([this.t('field.tags'), book.tags.map((t) => `\`${this._mdText(t)}\``).join(', ')]);
    if (book.pageCount) rows.push([this.t('field.pageCount'), I18N.formatNumber(book.pageCount)]);
    if (book.language) rows.push([this.t('field.language'), this._mdText(book.language)]);
    if (book.genre) rows.push([this.t('field.genre'), this._mdText(book.genre)]);
    rows.push([this.t('field.rating'), this._stars(book.rating)]);
    const price = this._price(book, base);
    if (price) rows.push([this.t('field.price'), price]);

    for (const [k, v] of rows) L.push(`- **${k}:** ${v}`);

    const trans = Object.entries(book.title.translations);
    if (trans.length) {
      L.push('');
      L.push(`- **${this.t('markdown.translations')}:**`);
      for (const [lang, text] of trans) L.push(`  - ${this._mdText(lang)}: ${this._mdText(text)}`);
    }

    if (book.quotes.length) {
      L.push('');
      for (const q of book.quotes) {
        L.push(`> ${String(q).replace(/\r?\n+/g, ' ').trim()}`);
        L.push('');
      }
    }
    if (book.notes && book.notes.trim()) {
      L.push('');
      L.push(`**${this.t('field.notes')}:**`);
      L.push('');
      L.push(String(book.notes).trim());
    }
    L.push('');
    return L.join('\n');
  },

  _summary(books, base) {
    const total = books.length;
    const pages = books.reduce((s, b) => s + (b.pageCount || 0), 0);
    const rated = books.filter((b) => b.rating > 0);
    const avg = rated.length ? (rated.reduce((s, b) => s + b.rating, 0) / rated.length) : 0;
    const value = books.reduce((s, b) => s + (CurrencyService.convert(b.price.amount, b.price.currency, base) || 0), 0);
    const series = new Set(books.filter((b) => b.hasSeries).map((b) => b.series.name));
    const langs = new Set(books.map((b) => b.language).filter(Boolean));

    return [
      `| ${this.t('stats.totalBooks')} | ${I18N.formatNumber(total)} |`,
      `| --- | ---: |`,
      `| ${this.t('stats.totalPages')} | ${I18N.formatNumber(pages)} |`,
      `| ${this.t('stats.avgRating')} | ${avg ? avg.toFixed(1) : '—'} |`,
      `| ${this.t('stats.series')} | ${series.size} |`,
      `| ${this.t('filters.allLanguages')} | ${langs.size} |`,
      `| ${this.t('stats.totalValue')} | ${CurrencyService.format(value, base)} |`
    ].join('\n');
  },

  /** Renders the whole library to a Markdown string. */
  library(books, settings) {
    const base = (settings && settings.baseCurrency) || 'USD';
    const list = books || [];
    const now = new Date();
    const out = [];
    out.push(`# ${OPEN_SHELF.name} — ${this.t('markdown.contents')}`);
    out.push('');
    out.push(`> ${this.t('markdown.generatedOn')} ${I18N.formatDate(now)} · ${I18N.formatTime(now)}`);
    out.push('');
    out.push(`## ${this.t('markdown.summary')}`);
    out.push('');
    out.push(this._summary(list, base));
    out.push('');
    out.push(`## ${this.t('markdown.contents')}`);
    out.push('');
    list.forEach((b, i) => out.push(this._bookBlock(b, i + 1, base)));
    out.push('---');
    out.push('');
    out.push(`${OPEN_SHELF.name} · ${OPEN_SHELF.repository}`);
    out.push('');
    return out.join('\n');
  },

  /** Renders a single book to a Markdown string. */
  book(book, settings) {
    const base = (settings && settings.baseCurrency) || 'USD';
    const now = new Date();
    return [
      `# ${this._mdText(book.title.main)} — ${this._mdText(book.author.name || '—')}`,
      '',
      `> ${OPEN_SHELF.name} · ${this.t('markdown.generatedOn')} ${I18N.formatDate(now)}`,
      '',
      this._bookBlock(book, 1, base).replace(/^### 1\.\s*/, ''),
      '---',
      '',
      `${OPEN_SHELF.name} · ${OPEN_SHELF.repository}`,
      ''
    ].join('\n');
  },

  download(filename, content) {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
};
window.Markdown = Markdown;
