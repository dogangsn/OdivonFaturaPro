import { COUNTRY_MAP, CountryConfig } from './countries.constant';

export interface CountryGuideInfo {
    /** Herkese açık adres: /invoice/<slug> */
    slug: string;
    /** COUNTRIES_CONFIG içindeki ülke kodu. */
    code: string;
    /** Faturada yer alması gereken vergi numarasının o ülkedeki adı (özel ad, çevrilmez). */
    taxIdName: string;
}

/** Ülke bazlı fatura rehberi sayfaları; metinler guide.* ve guide.note.<slug> çevirilerinde. */
export const COUNTRY_GUIDES: CountryGuideInfo[] = [
    { slug: 'turkey', code: 'TR', taxIdName: 'VKN / TCKN' },
    { slug: 'uae', code: 'AE', taxIdName: 'TRN (Tax Registration Number)' },
    { slug: 'germany', code: 'DE', taxIdName: 'Steuernummer / USt-IdNr.' },
    { slug: 'france', code: 'FR', taxIdName: 'SIREN / SIRET, N° TVA intracommunautaire' },
    { slug: 'uk', code: 'UK', taxIdName: 'VAT Registration Number' },
    { slug: 'spain', code: 'ES', taxIdName: 'NIF / NIF-IVA' },
    { slug: 'italy', code: 'IT', taxIdName: 'Partita IVA / Codice Fiscale' },
    { slug: 'netherlands', code: 'NL', taxIdName: 'btw-id, KvK-nummer' },
    { slug: 'canada', code: 'CA', taxIdName: 'Business Number (GST/HST)' },
    { slug: 'usa', code: 'US', taxIdName: 'EIN / state sales tax permit' },
    { slug: 'australia', code: 'AU', taxIdName: 'ABN' },
];

export function countryGuide(slug: string | null | undefined): (CountryGuideInfo & { country: CountryConfig }) | undefined {
    const guide = COUNTRY_GUIDES.find(g => g.slug === slug);
    return guide ? { ...guide, country: COUNTRY_MAP[guide.code] } : undefined;
}
