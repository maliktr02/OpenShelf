/* ─────────────────────────────────────────────────────────────
 * OpenShelf — flags.js
 * Tiny inline-SVG country flags used by the interface-language
 * picker so the selected language is obvious at a glance.
 * Simplified, dependency-free and offline — no emoji, no network.
 * ───────────────────────────────────────────────────────────── */
const OPEN_SHELF_FLAGS = (function () {
  const wrap = (inner) =>
    `<svg class="flag" viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${inner}</svg>`;

  /* Horizontal / vertical equal bands. */
  const h = (colors) => wrap(colors.map((c, i) =>
    `<rect y="${(i * 16 / colors.length).toFixed(3)}" width="24" height="${(16 / colors.length).toFixed(3)}" fill="${c}"/>`).join(''));
  const v = (colors) => wrap(colors.map((c, i) =>
    `<rect x="${(i * 24 / colors.length).toFixed(3)}" width="${(24 / colors.length).toFixed(3)}" height="16" fill="${c}"/>`).join(''));

  /* Five-pointed star centred at (cx,cy). */
  const star = (cx, cy, r, fill = '#fff') => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.42 : r;
      pts.push(`${(cx + Math.cos(ang) * rr).toFixed(2)},${(cy + Math.sin(ang) * rr).toFixed(2)}`);
    }
    return `<polygon points="${pts.join(' ')}" fill="${fill}"/>`;
  };

  return {
    /* English — Union Jack (simplified) */
    en: wrap(
      `<rect width="24" height="16" fill="#012169"/>` +
      `<path d="M0 0 L24 16 M24 0 L0 16" stroke="#fff" stroke-width="3.4"/>` +
      `<path d="M0 0 L24 16 M24 0 L0 16" stroke="#C8102E" stroke-width="1.6"/>` +
      `<path d="M12 0 V16 M0 8 H24" stroke="#fff" stroke-width="5.4"/>` +
      `<path d="M12 0 V16 M0 8 H24" stroke="#C8102E" stroke-width="3.2"/>`
    ),
    tr: wrap(
      `<rect width="24" height="16" fill="#E30A17"/>` +
      `<circle cx="9.6" cy="8" r="4" fill="#fff"/>` +
      `<circle cx="10.9" cy="8" r="3.2" fill="#E30A17"/>` +
      star(15.2, 8, 2.2, '#fff')
    ),
    de: h(['#000000', '#DD0000', '#FFCE00']),
    fr: v(['#0055A4', '#FFFFFF', '#EF4135']),
    es: wrap(
      `<rect width="24" height="16" fill="#AA151B"/>` +
      `<rect y="4" width="24" height="8" fill="#F1BF00"/>`
    ),
    it: v(['#009246', '#FFFFFF', '#CE2B37']),
    pt: wrap(
      `<rect width="24" height="16" fill="#DA291C"/>` +
      `<rect width="9.6" height="16" fill="#046A38"/>` +
      `<circle cx="9.6" cy="8" r="3.6" fill="#FFE900"/>` +
      `<circle cx="9.6" cy="8" r="2.2" fill="#DA291C"/>`
    ),
    ru: h(['#FFFFFF', '#0039A6', '#D52B1E']),
    ar: wrap(
      `<rect width="24" height="16" fill="#165D31"/>` +
      `<path d="M4.5 9.6 H19.5" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/>` +
      `<path d="M5 5.6 q3.5 -1.4 7 0" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round"/>`
    ),
    fa: wrap(
      `<rect width="24" height="5.33" fill="#239F40"/>` +
      `<rect y="5.33" width="24" height="5.34" fill="#FFFFFF"/>` +
      `<rect y="10.67" width="24" height="5.33" fill="#DA0000"/>` +
      `<path d="M12 6.3 l0.9 1.7 -0.9 1.7 -0.9 -1.7 z" fill="#DA0000"/>`
    ),
    hi: wrap(
      `<rect width="24" height="5.33" fill="#FF9933"/>` +
      `<rect y="5.33" width="24" height="5.34" fill="#FFFFFF"/>` +
      `<rect y="10.67" width="24" height="5.33" fill="#138808"/>` +
      `<circle cx="12" cy="8" r="2.1" fill="none" stroke="#000080" stroke-width="0.5"/>` +
      `<circle cx="12" cy="8" r="0.5" fill="#000080"/>`
    ),
    zh: wrap(
      `<rect width="24" height="16" fill="#DE2910"/>` +
      star(5, 4, 3, '#FFDE00') +
      star(9.4, 2.1, 1, '#FFDE00') +
      star(10.8, 4.4, 1, '#FFDE00') +
      star(10.8, 7.2, 1, '#FFDE00') +
      star(9.4, 9.5, 1, '#FFDE00')
    ),
    ja: wrap(
      `<rect width="24" height="16" fill="#FFFFFF"/>` +
      `<circle cx="12" cy="8" r="4.4" fill="#BC002D"/>`
    ),
    ko: wrap(
      `<rect width="24" height="16" fill="#FFFFFF"/>` +
      `<circle cx="12" cy="8" r="3.4" fill="#CD2E3A"/>` +
      `<path d="M12 4.6 A3.4 3.4 0 0 0 12 11.4 A1.7 1.7 0 0 1 12 8 A1.7 1.7 0 0 0 12 4.6 Z" fill="#0047A0"/>`
    ),
    nl: h(['#AE1C28', '#FFFFFF', '#21468B']),
    pl: h(['#FFFFFF', '#DC143C']),
    uk: h(['#0057B7', '#FFD700']),
    id: h(['#CE1126', '#FFFFFF']),
    el: wrap(
      `<rect width="24" height="16" fill="#FFFFFF"/>` +
      `<rect y="0" width="24" height="1.78" fill="#0D5EAF"/>` +
      `<rect y="3.56" width="24" height="1.78" fill="#0D5EAF"/>` +
      `<rect y="7.11" width="24" height="1.78" fill="#0D5EAF"/>` +
      `<rect y="10.67" width="24" height="1.78" fill="#0D5EAF"/>` +
      `<rect y="14.22" width="24" height="1.78" fill="#0D5EAF"/>` +
      `<rect width="9.33" height="9.33" fill="#0D5EAF"/>` +
      `<rect x="3.72" width="1.89" height="9.33" fill="#FFFFFF"/>` +
      `<rect y="3.72" width="9.33" height="1.89" fill="#FFFFFF"/>`
    ),
    sv: wrap(
      `<rect width="24" height="16" fill="#006AA7"/>` +
      `<rect x="7" width="4" height="16" fill="#FECC02"/>` +
      `<rect y="6" width="24" height="4" fill="#FECC02"/>`
    )
  };
})();

window.OPEN_SHELF_FLAGS = OPEN_SHELF_FLAGS;
