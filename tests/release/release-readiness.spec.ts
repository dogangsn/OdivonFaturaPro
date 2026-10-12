import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tr } from '../../src/app/core/i18n/tr';
import { en } from '../../src/app/core/i18n/en';
import { de } from '../../src/app/core/i18n/de';
import { fr } from '../../src/app/core/i18n/fr';
import { es } from '../../src/app/core/i18n/es';
import { it as itLang } from '../../src/app/core/i18n/it';
import { nl } from '../../src/app/core/i18n/nl';
import { ar } from '../../src/app/core/i18n/ar';
import { LEGAL_DOCS } from '../../src/app/core/constants/legal.constant';
import { COUNTRY_GUIDES } from '../../src/app/core/constants/country-guides.constant';
import { COUNTRY_MAP } from '../../src/app/core/constants/countries.constant';
import { HOME_FAQ } from '../../src/app/core/constants/home.constant';

// Canlıda para kazanmaya hazır olmak için gereken yapılandırma ve içerik kontrolleri.
// `gap(...)`: bugün eksik olan bir şeyi belgeler. Giderildiğinde test kırmızıya döner; o zaman `it` yapın.
const gap = it.fails;

const root = join(__dirname, '..', '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');
const json = (p: string) => JSON.parse(read(p));
const workflow = () => read('.github/workflows/firebase-hosting-merge.yml');

function srcFiles(dir: string): string[] {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap(e => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return p.includes('i18n') ? [] : srcFiles(p);
    return /\.(ts|html)$/.test(e.name) && !e.name.endsWith('.spec.ts') ? [p] : [];
  });
}
const appSource = () => srcFiles('src/app').map(read).join('\n');

describe('Yayın ve dağıtım', () => {
  it('canlı build environment.prod.ts dosyasını kullanmalı (production: true)', () => {
    const prod = json('angular.json').projects.OdivonFaturaPro.architect.build.configurations.production;
    expect(prod.fileReplacements).toContainEqual({
      replace: 'src/environments/environment.ts',
      with: 'src/environments/environment.prod.ts',
    });
  });

  it('master push Firestore kurallarını da yayınlamalı (yalnızca hosting değil)', () => {
    expect(workflow()).toMatch(/firestore/);
  });

  it('master push yayından önce testleri çalıştırmalı', () => {
    expect(workflow()).toMatch(/npm (run )?test|ng test|test:rules/);
  });

  it('Firestore kuralları tanımsız yolları kapatır', () => {
    expect(read('firestore.rules')).toMatch(/match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;/);
  });
});

describe('Ödeme ve plan yönetimi', () => {
  it('bir ödeme sağlayıcısı entegre olmalı (iyzico, PayTR, Stripe, Paddle...)', () => {
    const deps = Object.keys({ ...json('package.json').dependencies });
    const hasSdk = deps.some(d => /iyzi|paytr|stripe|paddle|lemon/i.test(d));
    const hasCheckout = /checkout|iyzipay|paytr\.com|stripe\.com|paddle\.com/i.test(appSource());
    expect(hasSdk || hasCheckout).toBe(true);
  });

  it('plan değişikliği sunucu tarafında (Cloud Functions) yapılmalı', () => {
    expect(json('firebase.json').functions).toBeDefined();
    expect(existsSync(join(root, 'functions'))).toBe(true);
  });

  it('satış iletişim bilgileri gerçek olmalı (yer tutucu WhatsApp numarası değil)', () => {
    expect(read('src/app/features/pricing/pricing.component.ts')).not.toContain('905000000000');
  });
});

describe('Yasal metinler', () => {
  const languages = { tr, en, de, fr, es, it: itLang, nl, ar };

  it('tüm dillerde aynı çeviri anahtarları var', () => {
    const base = Object.keys(tr).sort();
    for (const [code, table] of Object.entries(languages)) {
      expect(Object.keys(table).sort(), code).toEqual(base);
    }
  });

  it('kullanım koşulları, gizlilik ve KVKK metinleri her dilde dolu', () => {
    const keys = Object.keys(tr).filter(k => k.startsWith('legalDoc.'));
    for (const [code, table] of Object.entries(languages)) {
      for (const k of keys) expect(table[k]?.trim().length, `${code}:${k}`).toBeGreaterThan(0);
    }
  });

  it('ücretli abonelik için mesafeli satış sözleşmesi ve ön bilgilendirme formu olmalı', () => {
    const all = Object.values(tr).join(' ').toLocaleLowerCase('tr');
    expect(all).toContain('mesafeli satış sözleşmesi');
    expect(all).toContain('ön bilgilendirme');
  });

  it('iptal, cayma ve iade koşulları yazılı olmalı', () => {
    const legal = Object.entries(tr).filter(([k]) => k.startsWith('legalDoc.')).map(([, v]) => v).join(' ').toLocaleLowerCase('tr');
    expect(legal).toMatch(/cayma/);
    expect(legal).toMatch(/iade/);
  });

  it('satıcının tam unvanı, adresi ve vergi/MERSİS bilgisi yazılı olmalı', () => {
    const legal = Object.entries(tr).filter(([k]) => k.startsWith('legalDoc.')).map(([, v]) => v).join(' ').toLocaleLowerCase('tr');
    expect(legal).toMatch(/adres/);
    expect(legal).toMatch(/mersis|vergi no|vergi numarası/);
  });

  it('gizlilik metni yapay zeka taramasında verinin Google Gemini ile paylaşıldığını belirtmeli', () => {
    const privacy = Object.entries(tr).filter(([k]) => k.startsWith('legalDoc.privacy') || k.startsWith('legalDoc.kvkk')).map(([, v]) => v).join(' ');
    expect(privacy).toMatch(/Gemini|yapay zeka/i);
  });
});

describe('Çerez onayı, yasal sayfalar ve SEO', () => {
  const languages = { tr, en, de, fr, es, it: itLang, nl, ar };

  it('çerez onay bandı her sayfada (kök bileşende) yer alır', () => {
    expect(read('src/app/app.component.html')).toContain('<app-cookie-banner>');
  });

  it('AdSense betiği yalnızca reklam çerezi onayıyla yüklenir', () => {
    const ad = read('src/app/shared/components/ad-slot/ad-slot.component.ts');
    expect(ad).toMatch(/adsAllowed\(\)/);
    // Başka hiçbir yerde AdSense betiği eklenmemeli.
    const others = srcFiles('src').filter(f => !f.includes('ad-slot')).map(read).join('\n');
    expect(others).not.toMatch(/adsbygoogle\.js/);
  });

  it('Google Analytics yalnızca analitik çerez onayıyla ve canlı ortamda yüklenir', () => {
    const ga = read('src/app/core/services/analytics.service.ts');
    expect(ga).toMatch(/analyticsAllowed\(\)/);
    expect(ga).toMatch(/environment\.production/);
    const others = srcFiles('src').filter(f => !f.includes('analytics.service')).map(read).join('\n');
    expect(others).not.toMatch(/googletagmanager\.com/);
    for (const [code, table] of Object.entries(languages)) {
      expect(table['legalDoc.cookies.p2'], code).toMatch(/Google Analytics/);
      expect(table['cookie.analyticsTitle']?.length, code).toBeGreaterThan(0);
    }
  });

  it('her yasal metnin herkese açık bir sayfası ve sitemap kaydı var', () => {
    expect(read('src/app/app.routes.ts')).toMatch(/LEGAL_DOCS\.map/);
    const sitemap = read('public/sitemap.xml');
    for (const doc of LEGAL_DOCS) expect(sitemap, doc.path).toContain(`/${doc.path}<`);
  });

  it('yasal metinlerin tüm bölümleri her dilde dolu', () => {
    for (const [code, table] of Object.entries(languages)) {
      for (const doc of LEGAL_DOCS) {
        const keys = ['title', 'intro', ...Array.from({ length: doc.sections }, (_, i) => [`h${i + 1}`, `p${i + 1}`]).flat()];
        for (const k of keys) expect(table[`legalDoc.${doc.type}.${k}`]?.trim().length, `${code}:${doc.type}.${k}`).toBeGreaterThan(0);
        expect(table[`legalDoc.${doc.type}.h${doc.sections + 1}`], `${code}:${doc.type} fazladan bölüm`).toBeUndefined();
      }
    }
  });

  it('çerez politikası reklam çerezlerini ve onayın geri alınmasını anlatır', () => {
    const cookies = Object.entries(tr).filter(([k]) => k.startsWith('legalDoc.cookies.')).map(([, v]) => v).join(' ');
    expect(cookies).toMatch(/AdSense/);
    expect(cookies).toMatch(/geri al/);
  });

  it('index.html meta açıklama, Open Graph ve canonical içerir', () => {
    const html = read('src/index.html');
    expect(html).toMatch(/<meta name="description" content=".{50,160}">/);
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:description"');
    expect(html).toContain('rel="canonical"');
  });

  it('herkese açık her sayfanın çevrili başlığı ve açıklaması var', () => {
    for (const key of ['home', 'login', 'pricing', 'createInvoice', 'vatCalculator', ...LEGAL_DOCS.map(d => d.type)]) {
      for (const [code, table] of Object.entries(languages)) {
        expect(table[`seo.${key}.title`]?.length, `${code}:${key}.title`).toBeGreaterThan(0);
        const d = table[`seo.${key}.description`] ?? '';
        expect(d.length, `${code}:${key}.description`).toBeGreaterThan(50);
        expect(d.length, `${code}:${key}.description`).toBeLessThanOrEqual(170);
      }
    }
  });

  it('ana sayfa tüm diller için hreflang, sitemap dil alternatifleri ve yapılandırılmış veri sunar', () => {
    const html = read('src/index.html');
    const sitemap = read('public/sitemap.xml');
    for (const code of Object.keys(languages)) {
      expect(html, code).toContain(`hreflang="${code}" href="https://faturapro.odivon.com/${code}"`);
      expect(sitemap, code).toContain(`<loc>https://faturapro.odivon.com/${code}</loc>`);
      for (const k of ['h1', 'whyTitle', 'whyText', 'f1Title', 'f1Text', 'f2Title', 'f2Text', 'f3Title', 'f3Text', 'f4Title', 'f4Text']) {
        expect(languages[code as keyof typeof languages][`home.${k}`]?.trim().length, `${code}:home.${k}`).toBeGreaterThan(0);
      }
    }
    expect(html).toContain('hreflang="x-default"');
    expect(html).toContain('application/ld+json');
    expect(read('src/app/core/services/seo.service.ts')).toMatch(/hreflang/);
  });

  it('her ülke rehberinin sitemap kaydı, çevrili notu ve SSS metinleri var', () => {
    const sitemap = read('public/sitemap.xml');
    for (const g of COUNTRY_GUIDES) {
      expect(COUNTRY_MAP[g.code], g.slug).toBeDefined();
      expect(sitemap, g.slug).toContain(`<loc>https://faturapro.odivon.com/invoice/${g.slug}</loc>`);
      for (const code of Object.keys(languages)) {
        expect(sitemap, `${code}/${g.slug}`).toContain(`<loc>https://faturapro.odivon.com/${code}/invoice/${g.slug}</loc>`);
      }
      for (const [code, table] of Object.entries(languages)) {
        expect(table[`guide.note.${g.slug}`]?.trim().length, `${code}:${g.slug}`).toBeGreaterThan(0);
      }
    }
    for (const [code, table] of Object.entries(languages)) {
      for (const n of HOME_FAQ) {
        expect(table[`home.faq.q${n}`]?.trim().length, `${code}:q${n}`).toBeGreaterThan(0);
        expect(table[`home.faq.a${n}`]?.trim().length, `${code}:a${n}`).toBeGreaterThan(0);
      }
    }
    expect(read('public/robots.txt')).not.toMatch(/Disallow: \/invoice\s*$/m);
  });

  it('dil önekli ana sayfa ve rehberler önceden render edilir, diğer adresler tarayıcıda çizilir', () => {
    const angular = JSON.parse(read('angular.json'));
    const build = angular.projects.OdivonFaturaPro.architect.build.options;
    expect(build.outputMode).toBe('static');
    expect(build.server).toBe('src/main.server.ts');
    const serverRoutes = read('src/app/app.routes.server.ts');
    expect(serverRoutes).toContain('RenderMode.Prerender');
    expect(serverRoutes).toContain('COUNTRY_GUIDES');
    // Statik çıktıda tarayıcıda çizilen sayfaların kabuğu index.csr.html'dir; index.html önceden render edilmiş sayfadır.
    const hosting = JSON.parse(read('firebase.json')).hosting;
    expect(hosting.rewrites).toEqual([{ source: '**', destination: '/index.csr.html' }]);
    expect(hosting.trailingSlash).toBe(false);
    // Önceden render edilen sayfalarda tarayıcı adresi yok; canonical/hreflang sabit site adresiyle yazılır.
    expect(read('src/app/core/services/seo.service.ts')).not.toContain('location');
    expect(read('src/app/core/constants/site.constant.ts')).toContain("SITE_URL = 'https://faturapro.odivon.com'");
    const generator = read('scripts/generate-sitemap.mjs');
    for (const g of COUNTRY_GUIDES) expect(generator, g.slug).toContain(`'${g.slug}'`);
    for (const doc of LEGAL_DOCS) expect(generator, doc.path).toContain(`'${doc.path}'`);
    for (const code of Object.keys(languages)) expect(generator, code).toContain(`'${code}'`);
    expect(serverRoutes).toContain('tools/vat-calculator');
    const sitemap = read('public/sitemap.xml');
    for (const code of Object.keys(languages)) {
      expect(sitemap, code).toContain(`<loc>https://faturapro.odivon.com/${code}/tools/vat-calculator</loc>`);
      for (const k of ['h1', 'intro', 'addTax', 'removeTax', 'formulaAdd', 'formulaRemove', 'cta']) {
        expect(languages[code as keyof typeof languages][`tool.vat.${k}`]?.trim().length, `${code}:tool.vat.${k}`).toBeGreaterThan(0);
      }
    }
  });

  it('robots.txt panel sayfalarını dizinden çıkarır ve sitemap gösterir', () => {
    const robots = read('public/robots.txt');
    expect(robots).toMatch(/Disallow: \/dashboard/);
    expect(robots).toMatch(/Sitemap: https:\/\//);
  });

  it('tanımsız adresler ana sayfaya sessizce yönlenmez, "bulunamadı" sayfası açılır', () => {
    expect(read('src/app/app.routes.ts')).not.toMatch(/redirectTo: ''/);
    expect(read('src/app/app.routes.ts')).toContain('not-found.component');
  });
});

