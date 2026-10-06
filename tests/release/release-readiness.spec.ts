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
  gap('canlı build environment.prod.ts dosyasını kullanmalı (production: true)', () => {
    const prod = json('angular.json').projects.OdivonFaturaPro.architect.build.configurations.production;
    expect(prod.fileReplacements).toContainEqual({
      replace: 'src/environments/environment.ts',
      with: 'src/environments/environment.prod.ts',
    });
  });

  gap('master push Firestore kurallarını da yayınlamalı (yalnızca hosting değil)', () => {
    expect(workflow()).toMatch(/firestore/);
  });

  gap('master push yayından önce testleri çalıştırmalı', () => {
    expect(workflow()).toMatch(/npm (run )?test|ng test|test:rules/);
  });

  it('Firestore kuralları tanımsız yolları kapatır', () => {
    expect(read('firestore.rules')).toMatch(/match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;/);
  });
});

describe('Ödeme ve plan yönetimi', () => {
  gap('bir ödeme sağlayıcısı entegre olmalı (iyzico, PayTR, Stripe, Paddle...)', () => {
    const deps = Object.keys({ ...json('package.json').dependencies });
    const hasSdk = deps.some(d => /iyzi|paytr|stripe|paddle|lemon/i.test(d));
    const hasCheckout = /checkout|iyzipay|paytr\.com|stripe\.com|paddle\.com/i.test(appSource());
    expect(hasSdk || hasCheckout).toBe(true);
  });

  gap('plan değişikliği sunucu tarafında (Cloud Functions) yapılmalı', () => {
    expect(json('firebase.json').functions).toBeDefined();
    expect(existsSync(join(root, 'functions'))).toBe(true);
  });

  gap('satış iletişim bilgileri gerçek olmalı (yer tutucu WhatsApp numarası değil)', () => {
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

  gap('ücretli abonelik için mesafeli satış sözleşmesi ve ön bilgilendirme formu olmalı', () => {
    const all = Object.values(tr).join(' ').toLocaleLowerCase('tr');
    expect(all).toContain('mesafeli satış sözleşmesi');
    expect(all).toContain('ön bilgilendirme');
  });

  gap('iptal, cayma ve iade koşulları yazılı olmalı', () => {
    const legal = Object.entries(tr).filter(([k]) => k.startsWith('legalDoc.')).map(([, v]) => v).join(' ').toLocaleLowerCase('tr');
    expect(legal).toMatch(/cayma/);
    expect(legal).toMatch(/iade/);
  });

  gap('satıcının tam unvanı, adresi ve vergi/MERSİS bilgisi yazılı olmalı', () => {
    const legal = Object.entries(tr).filter(([k]) => k.startsWith('legalDoc.')).map(([, v]) => v).join(' ').toLocaleLowerCase('tr');
    expect(legal).toMatch(/adres/);
    expect(legal).toMatch(/mersis|vergi no|vergi numarası/);
  });

  gap('gizlilik metni yapay zeka taramasında verinin Google Gemini ile paylaşıldığını belirtmeli', () => {
    const privacy = Object.entries(tr).filter(([k]) => k.startsWith('legalDoc.privacy') || k.startsWith('legalDoc.kvkk')).map(([, v]) => v).join(' ');
    expect(privacy).toMatch(/Gemini|yapay zeka/i);
  });
});
