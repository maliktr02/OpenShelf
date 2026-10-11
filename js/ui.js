/* ─────────────────────────────────────────────────────────────
 * OpenShelf — UI
 * Rendering (grid / shelf / list), filtering, sorting, statistics
 * and settings application. Pure DOM APIs, minimal allocations.
 * ───────────────────────────────────────────────────────────── */
class UI {
  static settings = {};
  static books = [];
  static authorFilter = '';
  static langFilter = '';

  /* ── Boot ── */
  static async init() {
    this.settings = Store.getSettings();
    await I18N.setLocale(this.settings.uiLang);
    this.applySettings();

    this.books = Store.getBooks().map((b) => new Book(b));
    this.populateFilters();
    this.displayBooks();

    // Warm up currency rates, then re-render with live values.
    CurrencyService.refresh().then(() => this.displayBooks());
  }

  /* ── Small helpers ── */
  static esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  static hue(str) {
    let h = 0;
    str = String(str || '');
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
    return h;
  }

  static fallbackGradient(book) {
    const h = this.hue(book.title.main);
    return `linear-gradient(150deg, hsl(${h} 62% 52%), hsl(${(h + 42) % 360} 62% 38%))`;
  }

  static coverHtml(book, cls = 'cover') {
    if (book.photos.front) {
      return `<div class="${cls}"><img src="${this.esc(book.photos.front)}" alt="${this.esc(book.title.main)}" loading="lazy" onerror="this.style.display='none'"></div>`;
    }
    return `<div class="${cls}" style="background:${this.fallbackGradient(book)}">
      <span class="cover-fallback">${this.esc(book.title.main)}</span></div>`;
  }

  static starsHtml(rating, cls = 'stars') {
    let html = `<span class="${cls}" aria-label="${rating}/5">`;
    for (let i = 1; i <= 5; i++) html += `<i data-lucide="star" class="${i <= rating ? 'on' : ''}"></i>`;
    return html + '</span>';
  }

  static authorLine(book) {
    const { name, birthYear, deathYear } = book.author;
    let years = '';
    if (birthYear) years = ` (${birthYear}${deathYear ? '–' + deathYear : ''})`;
    return `${this.esc(name)}<span class="author-years">${this.esc(years)}</span>`;
  }

  static priceHtml(book) {
    if (!book.price || book.price.amount <= 0) return '';
    const info = CurrencyService.display(book.price.amount, book.price.currency, this.settings.baseCurrency);
    if (!info) return '';
    const original = info.converted && info.original
      ? `<span class="price-original">${this.esc(info.original)}</span>` : '';
    return `<div class="book-price"><span class="price-main">${this.esc(info.text)}</span>${original}</div>`;
  }

  /* ── Rendering ── */
  static displayBooks(books = null) {
    const list = books || this.filterAndSort(true);
    const view = this.settings.view || 'grid';
    const shelf = document.getElementById('shelf');
    const empty = document.getElementById('emptyState');

    if (!list.length) {
      shelf.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    let html = '';
    if (view === 'series') {
      shelf.innerHTML = this.renderSeriesView(list);
      if (window.lucide) lucide.createIcons({ nameAttr: 'data-lucide' });
      this.updateResultCount(list.length);
      return;
    }
    if (view === 'list') html += this.listHeaderHtml();
    for (const book of list) {
      if (view === 'grid') html += this.gridCardHtml(book);
      else if (view === 'shelf') html += this.spineHtml(book);
      else html += this.listRowHtml(book);
    }
    shelf.innerHTML = html;
    if (window.lucide) lucide.createIcons({ nameAttr: 'data-lucide' });
    this.updateResultCount(list.length);
  }

  static updateResultCount(count) {
    const el = document.getElementById('resultCount');
    if (!el) return;
    el.textContent = `${I18N.formatNumber(count)} ${I18N.t('unit.results')}`;
  }

  static seriesBadge(book) {
    if (!book.hasSeries) return '';
    const vol = book.series.volume ? `${I18N.t('series.volumeN')} ${I18N.formatNumber(book.series.volume)} · ` : '';
    return `<span class="badge badge-series"><i data-lucide="layers"></i>${vol}${this.esc(book.series.name)}</span>`;
  }

  static tagsHtml(book, max = 3) {
    if (!book.tags || !book.tags.length) return '';
    const shown = book.tags.slice(0, max).map((t) => `<span class="tag-chip">${this.esc(t)}</span>`).join('');
    const more = book.tags.length > max ? `<span class="tag-chip tag-more">+${book.tags.length - max}</span>` : '';
    return `<div class="tag-chips">${shown}${more}</div>`;
  }

  static cardActionsHtml(book) {
    const quoteDisabled = book.quotes.length ? '' : ' disabled';
    return `
      <div class="card-actions">
        <button type="button" class="icon-btn quote-btn"${quoteDisabled} data-i18n-title="action.quoteCard" title="${I18N.t('action.quoteCard')}"><i data-lucide="quote"></i></button>
        <button type="button" class="icon-btn edit-btn" data-i18n-title="action.editBook" title="${I18N.t('action.editBook')}"><i data-lucide="pencil"></i></button>
        <button type="button" class="icon-btn delete-btn" data-i18n-title="action.delete" title="${I18N.t('action.delete')}"><i data-lucide="trash-2"></i></button>
      </div>`;
  }

  static gridCardHtml(book) {
    const trans = Object.entries(book.title.translations)
      .map(([l, t]) => `${l}: ${t}`).join(' • ');
    const d = this.settings.display || {};
    const meta = (d.rating !== false)
      ? `<div class="card-meta">
            <span class="pages">${I18N.formatNumber(book.pageCount)} ${I18N.t('unit.pages')}</span>
            ${this.starsHtml(book.rating)}
          </div>`
      : `<div class="card-meta"><span class="pages">${I18N.formatNumber(book.pageCount)} ${I18N.t('unit.pages')}</span></div>`;
    return `
      <article class="book-card" data-id="${book.id}" tabindex="0">
        <div class="card-cover-wrap">
          ${this.coverHtml(book)}
          ${this.cardActionsHtml(book)}
        </div>
        <div class="card-body">
          <h3 class="book-title" ${trans ? `title="${this.esc(trans)}"` : ''}>${this.esc(book.title.main)}</h3>
          <p class="book-author">${this.authorLine(book)}</p>
          ${meta}
          ${d.series !== false ? this.seriesBadge(book) : ''}
          ${d.language !== false && book.language ? `<span class="badge">${this.esc(book.language)}</span>` : ''}
          ${d.tags !== false ? this.tagsHtml(book) : ''}
          ${d.price !== false ? this.priceHtml(book) : ''}
        </div>
      </article>`;
  }

  static spineHtml(book) {
    const h = Math.max(120, Math.min(210, 120 + (book.pageCount || 0) / 6));
    const bg = book.photos.spine
      ? `background-image:url('${this.esc(book.photos.spine)}')`
      : (book.photos.front ? `background-image:url('${this.esc(book.photos.front)}')` : `background:${this.fallbackGradient(book)}`);
    const vol = book.hasSeries && book.series.volume ? `<span class="spine-vol">${I18N.t('series.volumeN')} ${book.series.volume}</span>` : '';
    return `
      <button class="spine" data-id="${book.id}" style="--spine-h:${h}px;${bg}" title="${this.esc(book.title.main)} — ${this.esc(book.author.name)}">
        ${vol}
        <span class="spine-title">${this.esc(book.title.main)}</span>
        <span class="spine-author">${this.esc(book.author.name)}</span>
      </button>`;
  }

  static listHeaderHtml() {
    return `
      <div class="list-row list-header">
        <div class="list-cover"></div>
        <div class="list-title-block"><span>${I18N.t('section.title')}</span></div>
        <div class="list-cell">${I18N.t('field.pageCount')}</div>
        <div class="list-cell">${I18N.t('field.language')}</div>
        <div class="list-cell">${I18N.t('field.rating')}</div>
        <div class="list-cell">${I18N.t('field.price')}</div>
        <div class="list-actions"></div>
      </div>`;
  }

  static listRowHtml(book) {
    const d = this.settings.display || {};
    return `
      <div class="list-row" data-id="${book.id}">
        <div class="list-cover">${this.coverHtml(book, 'mini-cover')}</div>
        <div class="list-title-block">
          <span class="list-title">${this.esc(book.title.main)}</span>
          <span class="list-author">${this.authorLine(book)}</span>
          ${d.series !== false && book.hasSeries ? `<span class="list-series"><i data-lucide="layers"></i>${book.series.volume ? `${I18N.t('series.volumeN')} ${book.series.volume} · ` : ''}${this.esc(book.series.name)}</span>` : ''}
        </div>
        <div class="list-cell">${I18N.formatNumber(book.pageCount)}</div>
        <div class="list-cell">${d.language !== false && book.language ? this.esc(book.language) : '—'}</div>
        <div class="list-cell">${d.rating !== false ? this.starsHtml(book.rating, 'stars stars-sm') : '—'}</div>
        <div class="list-cell">${d.price !== false ? this.priceHtml(book) : '—'}</div>
        <div class="list-actions">
          <button class="icon-btn quote-btn"${book.quotes.length ? '' : ' disabled'} title="${I18N.t('action.quoteCard')}"><i data-lucide="quote"></i></button>
          <button class="icon-btn edit-btn" title="${I18N.t('action.editBook')}"><i data-lucide="pencil"></i></button>
          <button class="icon-btn delete-btn" title="${I18N.t('action.delete')}"><i data-lucide="trash-2"></i></button>
        </div>
      </div>`;
  }

  /* ── Series view ── */
  static seriesGroups(books) {
    const map = new Map();
    for (const b of books) {
      if (!b.hasSeries) continue;
      if (!map.has(b.series.name)) map.set(b.series.name, []);
      map.get(b.series.name).push(b);
    }
    const groups = [...map.entries()].map(([name, list]) => {
      const vols = list.filter((b) => b.series.volume).map((b) => b.series.volume).sort((a, b) => a - b);
      const max = vols.length ? Math.max(...vols) : 0;
      const missing = [];
      for (let i = 1; i <= max; i++) if (!vols.includes(i)) missing.push(i);
      return { name, list, owned: list.length, max, volumes: vols, missing };
    });
    groups.sort((a, b) => a.name.localeCompare(b.name, I18N.currentLocale));
    return groups;
  }

  static seriesCardHtml(group) {
    const sorted = [...group.list].sort((a, b) => (a.series.volume || 9999) - (b.series.volume || 9999));
    const pct = group.max ? Math.round((group.volumes.length / group.max) * 100) : 100;
    const complete = group.missing.length === 0 && group.max > 0;
    const covers = sorted.map((b) => `
      <button class="series-cover" data-id="${b.id}" title="${this.esc(b.title.main)}">
        ${this.coverHtml(b, 'series-cover-inner')}
        ${b.series.volume ? `<span class="series-vol">${I18N.t('series.volumeN')} ${b.series.volume}</span>` : ''}
      </button>`).join('');
    const missingLine = group.missing.length
      ? `<span class="series-missing">${I18N.t('series.missing')}: ${group.missing.join(', ')}</span>`
      : (group.max > 1 ? `<span class="series-complete"><i data-lucide="badge-check"></i>${I18N.t('series.complete')}</span>` : '');
    return `
      <section class="series-group">
        <header class="series-head">
          <div class="series-head-main">
            <h3>${this.esc(group.name)}</h3>
            <span class="series-count">${group.owned} ${I18N.t('series.volumesOwned')}</span>
          </div>
          ${missingLine}
        </header>
        <div class="series-progress"><span style="width:${pct}%"></span></div>
        <div class="series-covers">${covers}</div>
      </section>`;
  }

  static renderSeriesView(list) {
    const groups = this.seriesGroups(list);
    const loose = list.filter((b) => !b.hasSeries);
    if (!groups.length && !loose.length) return '';
    let html = groups.map((g) => this.seriesCardHtml(g)).join('');
    if (!groups.length) html += `<p class="muted series-empty">${I18N.t('series.empty')}</p>`;
    if (loose.length) {
      html += `<section class="series-group series-loose">
        <header class="series-head"><div class="series-head-main"><h3>${I18N.t('view.list')}</h3>
          <span class="series-count">${loose.length}</span></div></header>
        <div class="series-covers">${loose.map((b) => `
          <button class="series-cover" data-id="${b.id}" title="${this.esc(b.title.main)}">
            ${this.coverHtml(b, 'series-cover-inner')}</button>`).join('')}</div>
      </section>`;
    }
    return html;
  }

  /* ── Filters & sorting ── */
  static populateFilters() {
    const authors = new Set();
    const langs = new Set();
    const series = new Set();
    const tags = new Set();
    for (const b of this.books) {
      if (b.author.name) authors.add(b.author.name);
      if (b.language) langs.add(b.language);
      if (b.hasSeries) series.add(b.series.name);
      for (const t of b.tags) tags.add(t);
    }
    const authorSel = document.getElementById('filterAuthor');
    const langSel = document.getElementById('filterLang');
    const seriesSel = document.getElementById('filterSeries');
    const tagSel = document.getElementById('filterTag');
    const curAuthor = authorSel ? authorSel.value : '';
    const curLang = langSel ? langSel.value : '';
    const curSeries = seriesSel ? seriesSel.value : '';
    const curTag = tagSel ? tagSel.value : '';

    if (authorSel) {
      authorSel.innerHTML = `<option value="">${I18N.t('filters.allAuthors')}</option>` +
        [...authors].sort().map((a) => `<option value="${this.esc(a)}"${a === curAuthor ? ' selected' : ''}>${this.esc(a)}</option>`).join('');
    }
    if (langSel) {
      langSel.innerHTML = `<option value="">${I18N.t('filters.allLanguages')}</option>` +
        [...langs].sort().map((l) => `<option value="${this.esc(l)}"${l === curLang ? ' selected' : ''}>${this.esc(l)}</option>`).join('');
    }
    if (seriesSel) {
      seriesSel.innerHTML = `<option value="">${I18N.t('filters.allSeries')}</option>` +
        [...series].sort((a, b) => a.localeCompare(b, I18N.currentLocale)).map((s) => `<option value="${this.esc(s)}"${s === curSeries ? ' selected' : ''}>${this.esc(s)}</option>`).join('');
    }
    if (tagSel) {
      tagSel.innerHTML = `<option value="">${I18N.t('filters.allTags')}</option>` +
        [...tags].sort((a, b) => a.localeCompare(b, I18N.currentLocale)).map((t) => `<option value="${this.esc(t)}"${t === curTag ? ' selected' : ''}>${this.esc(t)}</option>`).join('');
    }
  }

  static filterAndSort(returnList = false) {
    const term = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const author = document.getElementById('filterAuthor')?.value || '';
    const lang = document.getElementById('filterLang')?.value || '';
    const series = document.getElementById('filterSeries')?.value || '';
    const tag = document.getElementById('filterTag')?.value || '';
    const rating = parseInt(document.getElementById('filterRating')?.value || '0') || 0;
    const priceBand = document.getElementById('filterPrice')?.value || '';
    const sort = document.getElementById('sortData')?.value || 'newest';

    let list = this.books.filter((b) => {
      if (term) {
        const hay = [
          b.title.main,
          Object.values(b.title.translations).join(' '),
          b.author.name,
          b.genre,
          b.language,
          b.series.name,
          b.tags.join(' '),
          b.quotes.join(' '),
          b.notes
        ].join(' ').toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (author && b.author.name !== author) return false;
      if (lang && b.language !== lang) return false;
      if (series && b.series.name !== series) return false;
      if (tag && !b.tags.includes(tag)) return false;
      if (rating && b.rating < rating) return false;
      if (priceBand) {
        const usd = CurrencyService.convert(b.price.amount, b.price.currency, 'USD') || 0;
        const [min, max] = priceBand.split('-').map(Number);
        if (usd < min || (max && usd >= max)) return false;
      }
      return true;
    });

    const byTitle = (a, b) => a.title.main.localeCompare(b.title.main, I18N.currentLocale);
    switch (sort) {
      case 'oldest': list.sort((a, b) => a.createdAt - b.createdAt); break;
      case 'titleAZ': list.sort(byTitle); break;
      case 'titleZA': list.sort((a, b) => byTitle(b, a)); break;
      case 'rating': list.sort((a, b) => b.rating - a.rating || b.createdAt - a.createdAt); break;
      case 'pages': list.sort((a, b) => b.pageCount - a.pageCount); break;
      case 'series': list.sort((a, b) =>
        a.series.name.localeCompare(b.series.name, I18N.currentLocale) ||
        (a.series.volume || 0) - (b.series.volume || 0)); break;
      case 'price': list.sort((a, b) =>
        (CurrencyService.convert(b.price.amount, b.price.currency, 'USD') || 0) -
        (CurrencyService.convert(a.price.amount, a.price.currency, 'USD') || 0)); break;
      default: list.sort((a, b) => b.createdAt - a.createdAt);
    }
    return list;
  }

  static onFiltersChanged() {
    this.displayBooks();
  }

  static clearFilters() {
    const s = document.getElementById('searchInput');
    if (s) s.value = '';
    ['filterAuthor', 'filterLang', 'filterSeries', 'filterTag', 'filterRating', 'filterPrice'].forEach((id) => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    const sort = document.getElementById('sortData');
    if (sort) sort.value = this.settings.sort || 'newest';
    this.authorFilter = ''; this.langFilter = '';
    this.displayBooks();
  }

  /* ── Statistics ── */
  static showStats() {
    const books = this.books;
    const base = this.settings.baseCurrency;
    const total = books.length;
    const pages = books.reduce((s, b) => s + (b.pageCount || 0), 0);
    const rated = books.filter((b) => b.rating > 0);
    const avg = rated.length ? (rated.reduce((s, b) => s + b.rating, 0) / rated.length) : 0;
    const value = books.reduce((s, b) => s + (CurrencyService.convert(b.price.amount, b.price.currency, base) || 0), 0);
    const seriesGroups = this.seriesGroups(books);

    const authorCounts = this._count(books, (b) => b.author.name);
    const langCounts = this._count(books, (b) => b.language);
    const tagCounts = {};
    books.forEach((b) => b.tags.forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
    const ratingDist = [0, 0, 0, 0, 0];
    books.forEach((b) => { if (b.rating >= 1 && b.rating <= 5) ratingDist[b.rating - 1]++; });
    const recent = [...books].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

    const topAuthor = this._top(authorCounts);
    const topLang = this._top(langCounts);

    // Added-over-time (last 12 months)
    const now = new Date();
    const monthFmt = new Intl.DateTimeFormat(I18N.currentLocale, { month: 'short' });
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: monthFmt.format(d), value: 0 });
    }
    books.forEach((b) => {
      const d = new Date(b.createdAt);
      const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (m) m.value++;
    });

    const statBox = (valueHtml, label, icon) => `
      <div class="stat-box">
        <div class="stat-icon"><i data-lucide="${icon}"></i></div>
        <div class="stat-value">${valueHtml}</div>
        <div class="stat-label">${label}</div>
      </div>`;

    const ratingChart = Charts.bars(ratingDist.map((c, i) => ({ label: String(i + 1), value: c })));
    const langChart = Charts.donut(Object.entries(langCounts).sort((a, b) => b[1] - a[1]).slice(0, 7)
      .map(([label, value]) => ({ label, value })));
    const growthChart = Charts.area(months);

    const seriesHtml = seriesGroups.length ? seriesGroups.map((g) => {
      const pct = g.max ? Math.round((g.volumes.length / g.max) * 100) : 100;
      const missing = g.missing.length ? ` · ${I18N.t('series.missing')}: ${g.missing.join(', ')}` : '';
      return `
        <div class="sp-row">
          <div class="sp-head"><span>${this.esc(g.name)}</span>
            <span class="muted">${g.owned}${g.max ? '/' + g.max : ''}</span></div>
          <div class="series-progress"><span style="width:${pct}%"></span></div>
          <div class="sp-meta">${g.owned} ${I18N.t('series.volumesOwned')}${missing}</div>
        </div>`;
    }).join('') : `<p class="muted">${I18N.t('stats.noSeries')}</p>`;

    const maxTag = Math.max(1, ...Object.values(tagCounts), 1);
    const tagCloud = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 18).map(([t, c]) => {
      const scale = 0.82 + (c / maxTag) * 0.55;
      return `<span class="tag-chip cloud" style="font-size:${scale}rem" title="${c}">${this.esc(t)} <b>${c}</b></span>`;
    }).join('') || `<p class="muted">${I18N.t('stats.noData')}</p>`;

    const recentList = recent.length ? recent.map((b) => `
      <div class="recent-item" data-id="${b.id}">
        <div class="recent-cover">${this.coverHtml(b, 'mini-cover')}</div>
        <div><div class="list-title">${this.esc(b.title.main)}</div>
        <div class="list-author">${this.esc(b.author.name)}</div></div>
      </div>`).join('') : `<p class="muted">${I18N.t('stats.noData')}</p>`;

    document.getElementById('statsContainer').innerHTML = `
      <div class="stats-top">
        ${statBox(I18N.formatNumber(total), I18N.t('stats.totalBooks'), 'library')}
        ${statBox(I18N.formatNumber(pages), I18N.t('stats.totalPages'), 'files')}
        ${statBox(avg ? avg.toFixed(1) : '—', I18N.t('stats.avgRating'), 'star')}
        ${statBox(I18N.formatNumber(seriesGroups.length), I18N.t('stats.series'), 'layers')}
        ${statBox(CurrencyService.format(value, base), I18N.t('stats.totalValue'), 'wallet')}
      </div>
      <div class="stats-detail">
        <div class="stat-panel">
          <h4><i data-lucide="bar-chart-3"></i> ${I18N.t('stats.chartRatings')}</h4>
          <div class="chart-holder">${ratingChart}</div>
        </div>
        <div class="stat-panel">
          <h4><i data-lucide="languages"></i> ${I18N.t('stats.chartLanguages')}</h4>
          <div class="chart-holder">${langChart}</div>
        </div>
        <div class="stat-panel span-2">
          <h4><i data-lucide="trending-up"></i> ${I18N.t('stats.growth')} <span class="muted panel-sub">${I18N.t('stats.last12')}</span></h4>
          <div class="chart-holder">${growthChart}</div>
        </div>
        <div class="stat-panel span-2">
          <h4><i data-lucide="layers"></i> ${I18N.t('stats.seriesProgress')}</h4>
          <div class="series-progress-list">${seriesHtml}</div>
        </div>
        <div class="stat-panel">
          <h4><i data-lucide="tags"></i> ${I18N.t('stats.tags')}</h4>
          <div class="tag-cloud">${tagCloud}</div>
        </div>
        <div class="stat-panel">
          <h4><i data-lucide="user-round"></i> ${I18N.t('stats.topAuthor')}</h4>
          <p class="stat-highlight">${topAuthor ? this.esc(topAuthor[0]) : '—'}${topAuthor ? ` <span class="muted">(${topAuthor[1]})</span>` : ''}</p>
          <h4 style="margin-top:1rem"><i data-lucide="globe"></i> ${I18N.t('stats.topLanguage')}</h4>
          <p class="stat-highlight">${topLang ? this.esc(topLang[0]) : '—'}${topLang ? ` <span class="muted">(${topLang[1]})</span>` : ''}</p>
          <h4 style="margin-top:1rem"><i data-lucide="star"></i> ${I18N.t('stats.rated')}</h4>
          <p class="stat-highlight">${rated.length}</p>
        </div>
        <div class="stat-panel">
          <h4><i data-lucide="clock"></i> ${I18N.t('stats.recent')}</h4>
          <div class="recent-list">${recentList}</div>
        </div>
      </div>`;
    if (window.lucide) lucide.createIcons();
    App.openModal('statsModal');
  }

  static _count(books, fn) {
    const map = {};
    books.forEach((b) => { const k = fn(b); if (k) map[k] = (map[k] || 0) + 1; });
    return map;
  }

  static _top(map) {
    const e = Object.entries(map).sort((a, b) => b[1] - a[1])[0];
    return e || null;
  }

  /* ── Settings application ── */
  static applySettings() {
    const root = document.documentElement;
    // Theme (auto respects the OS preference)
    let theme = this.settings.theme;
    if (theme === 'auto') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.body.dataset.theme = theme;
    document.body.dataset.view = this.settings.view || 'grid';
    document.body.dataset.cardSize = this.settings.cardSize || 'normal';
    document.body.dataset.density = this.settings.density || 'comfortable';
    document.body.dataset.font = this.settings.font || 'sans';
    root.style.setProperty('--accent', this.settings.accent);
    root.style.setProperty('--accent-2', this._shift(this.settings.accent, 40));
    document.body.classList.toggle('no-anim', !this.settings.animations);
    document.querySelectorAll('.view-btn').forEach((b) =>
      b.classList.toggle('active', b.dataset.view === (this.settings.view || 'grid')));
  }

  static _shift(hex, deg) {
    // Shift a hex colour's hue by `deg` degrees for the gradient partner.
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    if (!m) return '#a855f7';
    let [r, g, b] = [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h /= 6;
    }
    h = (h + deg / 360) % 1;
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    let r2, g2, b2;
    if (s === 0) { r2 = g2 = b2 = l; }
    else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r2 = hue2rgb(p, q, h + 1 / 3); g2 = hue2rgb(p, q, h); b2 = hue2rgb(p, q, h - 1 / 3);
    }
    const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
    return `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`;
  }

  static refresh() {
    this.applySettings();
    this.populateFilters();
    this.displayBooks();
  }

  /* ── Views ── */
  static setView(view) {
    this.settings.view = view;
    Store.saveSettings(this.settings);
    document.querySelectorAll('.view-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
    this.applySettings();
    this.displayBooks();
  }
}
