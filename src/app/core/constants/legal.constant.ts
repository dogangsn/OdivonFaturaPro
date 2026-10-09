export type LegalDocType = 'terms' | 'privacy' | 'kvkk' | 'cookies' | 'sales';

export interface LegalDocInfo {
    type: LegalDocType;
    /** Herkese açık sayfa adresi (başında / olmadan). */
    path: string;
    /** Footer ve sekmelerdeki kısa ad. */
    labelKey: string;
    /** Metindeki bölüm sayısı: legalDoc.<type>.h1..hN ve p1..pN anahtarları. */
    sections: number;
}

/** Yasal metinlerde gösterilen son güncelleme tarihi; metinleri değiştirdiğinizde güncelleyin. */
export const LEGAL_LAST_UPDATED = '2026-10-09';

/** Kullanım şartları sürümü; kullanıcı profilinde onay kaydıyla birlikte saklanır. */
export const TERMS_VERSION = LEGAL_LAST_UPDATED;

export const LEGAL_DOCS: LegalDocInfo[] = [
    { type: 'terms', path: 'kullanim-sartlari', labelKey: 'legal.terms', sections: 8 },
    { type: 'privacy', path: 'gizlilik-politikasi', labelKey: 'legal.privacyPolicy', sections: 8 },
    { type: 'kvkk', path: 'kvkk-aydinlatma-metni', labelKey: 'legal.kvkk', sections: 6 },
    { type: 'cookies', path: 'cerez-politikasi', labelKey: 'legal.cookiePolicy', sections: 4 },
    { type: 'sales', path: 'mesafeli-satis-sozlesmesi', labelKey: 'legal.salesShort', sections: 4 },
];

export function legalDoc(type: LegalDocType): LegalDocInfo {
    return LEGAL_DOCS.find(d => d.type === type)!;
}
