/* ─────────────────────────────────────────────────────────────
 * OpenShelf — Currency service
 * Converts book prices into the user's chosen base currency.
 *
 * Strategy: all rates are expressed relative to USD. Live rates
 * are fetched from a CORS-friendly provider (Frankfurter / ECB)
 * and cached for a few hours. When offline, a bundled fallback
 * table is used so conversion still works — this is why a book
 * priced at 25 TRY correctly shows ~0.73 USD rather than 25 USD.
 * ───────────────────────────────────────────────────────────── */
class CurrencyService {
  static liveRates = null;
  static fetchedAt = 0;
  static TTL = 6 * 60 * 60 * 1000; // 6 hours
  static CACHE_KEY = 'openshelf.rates';
  static lastError = null;

  static _restoreCache() {
    try {
      const raw = localStorage.getItem(this.CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.rates && Date.now() - parsed.fetchedAt < this.TTL) {
        this.liveRates = parsed.rates;
        this.fetchedAt = parsed.fetchedAt;
      }
    } catch (e) { /* ignore */ }
  }

  static _persistCache() {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify({ rates: this.liveRates, fetchedAt: this.fetchedAt }));
    } catch (e) { /* ignore */ }
  }

  /** Fetch fresh USD-based rates; safe to call on startup. */
  static async refresh(force = false) {
    if (!force && this.liveRates && Date.now() - this.fetchedAt < this.TTL) return this.liveRates;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      const res = await fetch('https://api.frankfurter.app/latest?from=USD', { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        this.liveRates = { ...(data.rates || {}), USD: 1 };
        this.fetchedAt = Date.now();
        this.lastError = null;
        this._persistCache();
        return this.liveRates;
      }
    } catch (e) {
      this.lastError = e;
    }
    return this.liveRates;
  }

  /** units of `code` per 1 USD */
  static rate(code) {
    code = (code || 'USD').toUpperCase();
    if (code === 'USD') return 1;
    if (this.liveRates && this.liveRates[code] != null) return this.liveRates[code];
    const fallback = OPEN_SHELF.currencies[code];
    return fallback ? fallback.rate : null;
  }

  static isLive(code) {
    code = (code || 'USD').toUpperCase();
    return !!(this.liveRates && this.liveRates[code] != null);
  }

  /** Synchronous conversion using whatever rates are currently available. */
  static convert(amount, from, to) {
    amount = parseFloat(amount);
    if (!isFinite(amount)) return null;
    from = (from || 'USD').toUpperCase();
    to = (to || 'USD').toUpperCase();
    if (from === to) return amount;
    const rf = this.rate(from);
    const rt = this.rate(to);
    if (rf == null || rt == null) return null;
    return (amount / rf) * rt; // via USD
  }

  /** Formats a value with the currency of `code`, respecting the locale. */
  static format(amount, code) {
    code = (code || 'USD').toUpperCase();
    try {
      return new Intl.NumberFormat(I18N.currentLocale, {
        style: 'currency', currency: code, maximumFractionDigits: 2
      }).format(amount);
    } catch (e) {
      const sym = OPEN_SHELF.currencies[code]?.symbol || code;
      return `${sym}${Number(amount).toFixed(2)}`;
    }
  }

  /**
   * Returns { text, converted, original } for display.
   * `text` is always in the base currency when conversion is possible.
   */
  static display(amount, fromCurrency, baseCurrency) {
    amount = parseFloat(amount);
    if (!isFinite(amount) || amount <= 0) return null;
    fromCurrency = (fromCurrency || 'USD').toUpperCase();
    baseCurrency = (baseCurrency || 'USD').toUpperCase();

    const converted = this.convert(amount, fromCurrency, baseCurrency);
    if (converted == null) {
      return { text: this.format(amount, fromCurrency), converted: false, original: this.format(amount, fromCurrency) };
    }
    const sameCurrency = fromCurrency === baseCurrency;
    return {
      text: this.format(converted, baseCurrency),
      converted: !sameCurrency,
      original: sameCurrency ? null : this.format(amount, fromCurrency)
    };
  }
}

CurrencyService._restoreCache();
