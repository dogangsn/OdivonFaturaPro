// public/sitemap.xml üretir: `node scripts/generate-sitemap.mjs`
// Dil önekli sayfalar (ana sayfa, ülke rehberleri, araçlar) /xx/ sürümleriyle, diğer herkese açık sayfalar ?lang=xx ile.
// Listeler src/app içindeki tanımlarla aynı olmalı (release testi kontrol eder):
//   SITE_URL → core/constants/site.constant.ts, LANGS → language.service.ts,
//   GUIDES → country-guides.constant.ts, LEGAL → legal.constant.ts
import { writeFileSync } from 'node:fs';

const SITE_URL = 'https://faturapro.odivon.com';
const LANGS = ['tr', 'en', 'de', 'fr', 'es', 'it', 'nl', 'ar'];
const GUIDES = ['turkey', 'uae', 'germany', 'france', 'uk', 'spain', 'italy', 'netherlands', 'canada', 'usa', 'australia'];
const TOOLS = ['tools/vat-calculator'];
const QUERY_LANG_PAGES = ['create-invoice', 'pricing'];
const LEGAL = ['kullanim-sartlari', 'gizlilik-politikasi', 'kvkk-aydinlatma-metni', 'cerez-politikasi', 'mesafeli-satis-sozlesmesi'];
const today = new Date().toISOString().slice(0, 10);

const localized = (path, lang) => `${SITE_URL}/${lang ? lang + (path ? '/' + path : '') : path}`;
const queried = (path, lang) => `${SITE_URL}/${path}${lang ? `?lang=${lang}` : ''}`;

function group(path, url) {
  const alternates = [...LANGS.map(l => [l, url(path, l)]), ['x-default', url(path)]]
    .map(([l, href]) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${href.replace(/&/g, '&amp;')}"/>`)
    .join('\n');
  return [undefined, ...LANGS].map(l => `  <url>\n    <loc>${url(path, l)}</loc>\n    <lastmod>${today}</lastmod>\n${alternates}\n  </url>`);
}

const urls = [
  ...group('', localized),
  ...GUIDES.flatMap(slug => group(`invoice/${slug}`, localized)),
  ...TOOLS.flatMap(path => group(path, localized)),
  ...QUERY_LANG_PAGES.flatMap(path => group(path, queried)),
  ...LEGAL.map(path => `  <url><loc>${SITE_URL}/${path}</loc><lastmod>${today}</lastmod></url>`),
];

writeFileSync(new URL('../public/sitemap.xml', import.meta.url),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`);
console.log(`sitemap.xml: ${urls.length} adres`);
