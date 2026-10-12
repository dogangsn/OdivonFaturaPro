import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

export type Language = 'tr' | 'en' | 'de' | 'fr' | 'es' | 'it' | 'nl' | 'ar';

export interface LanguageOption {
    code: Language;
    nativeName: string;
    flagUrl: string;
    locale: string;
    dir: 'ltr' | 'rtl';
}

// Languages of every country the app issues invoices for.
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
    { code: 'tr', nativeName: 'Türkçe', flagUrl: '/flags/tr.svg', locale: 'tr', dir: 'ltr' },
    { code: 'en', nativeName: 'English', flagUrl: '/flags/gb.svg', locale: 'en-GB', dir: 'ltr' },
    { code: 'de', nativeName: 'Deutsch', flagUrl: '/flags/de.svg', locale: 'de', dir: 'ltr' },
    { code: 'fr', nativeName: 'Français', flagUrl: '/flags/fr.svg', locale: 'fr', dir: 'ltr' },
    { code: 'es', nativeName: 'Español', flagUrl: '/flags/es.svg', locale: 'es', dir: 'ltr' },
    { code: 'it', nativeName: 'Italiano', flagUrl: '/flags/it.svg', locale: 'it', dir: 'ltr' },
    { code: 'nl', nativeName: 'Nederlands', flagUrl: '/flags/nl.svg', locale: 'nl', dir: 'ltr' },
    { code: 'ar', nativeName: 'العربية', flagUrl: '/flags/ae.svg', locale: 'ar', dir: 'rtl' },
];

type Table = Record<string, string>;

// Çeviri tabloları dil başına ayrı dosyada yüklenir; ziyaretçi yalnızca kendi dilini indirir (8 dilin hepsi ~660 KB).
const LOADERS: Record<Language, () => Promise<Table>> = {
    tr: () => import('../i18n/tr').then(m => m.tr),
    en: () => import('../i18n/en').then(m => m.en),
    de: () => import('../i18n/de').then(m => m.de),
    fr: () => import('../i18n/fr').then(m => m.fr),
    es: () => import('../i18n/es').then(m => m.es),
    it: () => import('../i18n/it').then(m => m.it),
    nl: () => import('../i18n/nl').then(m => m.nl),
    ar: () => import('../i18n/ar').then(m => m.ar),
};

const LANGUAGE_CODES = new Set<string>(SUPPORTED_LANGUAGES.map(l => l.code));

export function isLanguage(code: string | null | undefined): code is Language {
    return !!code && LANGUAGE_CODES.has(code);
}

/** Dil önekli adresin dili (ör. /de/invoice/germany → de); önek yoksa null. */
export function langFromPath(path: string | null | undefined): Language | null {
    const first = (path ?? '').split(/[?#]/)[0].split('/').filter(Boolean)[0];
    return isLanguage(first) ? first : null;
}

/** Ziyaretçinin tarayıcı dillerinden desteklenen ilki; hiçbiri yoksa İngilizce (küresel varsayılan). */
function browserLanguage(): Language {
    const preferred = typeof navigator === 'undefined' ? [] : (navigator.languages?.length ? navigator.languages : [navigator.language]);
    for (const tag of preferred) {
        const code = tag?.toLowerCase().split('-')[0];
        if (isLanguage(code)) return code;
    }
    return 'en';
}

@Injectable({
    providedIn: 'root'
})
export class LanguageService {
    private platformId = inject(PLATFORM_ID);
    private document = inject(DOCUMENT);

    readonly languages = SUPPORTED_LANGUAGES;
    currentLang = signal<Language>('tr');
    private tables = signal<Partial<Record<Language, Table>>>({});
    private cache = new Map<string, { lang: Language; value: unknown }>();
    /** Başlangıç dilinin tablosu yüklendiğinde çözülür; uygulama bundan önce çizilmez (app.config). */
    readonly ready: Promise<void>;

    constructor() {
        // Dil önekli sayfalar (/de, /de/invoice/germany) sunucuda önceden render edilir; dil adresten gelir.
        const fromPath = langFromPath(this.document.location?.pathname);
        if (!isPlatformBrowser(this.platformId)) {
            this.currentLang.set(fromPath ?? 'en');
        } else {
            // Öncelik: adres öneki (/de/...) > ?lang= (paylaşılan/arama motoru bağlantısı) > kayıtlı seçim > tarayıcı dili > İngilizce.
            const fromUrl = fromPath ?? new URLSearchParams(this.document.location?.search ?? '').get('lang');
            if (isLanguage(fromUrl)) {
                this.currentLang.set(fromUrl);
                localStorage.setItem('lang', fromUrl);
            } else {
                const saved = localStorage.getItem('lang');
                this.currentLang.set(isLanguage(saved) ? saved : browserLanguage());
            }
        }
        this.applyDocumentLang();
        this.ready = this.load(this.currentLang());
    }

    /** Dilin tablosunu indirir, sonra arayüzü o dile geçirir (yarım çevrili ekran görünmez). */
    async setLanguage(lang: Language): Promise<void> {
        await this.load(lang);
        this.currentLang.set(lang);
        this.applyDocumentLang();
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('lang', lang);
        }
    }

    private async load(lang: Language): Promise<void> {
        if (this.tables()[lang]) return;
        const table = await LOADERS[lang]();
        this.tables.update(t => ({ ...t, [lang]: table }));
    }

    /**
     * Returns the translation for key, filling {name} placeholders from params.
     * Falls back to English, then Turkish (when already loaded), then the key itself.
     */
    t(key: string, params?: Record<string, string | number | null | undefined>): string {
        const tables = this.tables();
        let text = tables[this.currentLang()]?.[key] ?? tables.en?.[key] ?? tables.tr?.[key] ?? key;
        if (params) {
            for (const [name, value] of Object.entries(params)) {
                text = text.split(`{${name}}`).join(String(value ?? ''));
            }
        }
        return text;
    }

    get lang(): Language {
        return this.currentLang();
    }

    get current(): LanguageOption {
        return SUPPORTED_LANGUAGES.find(l => l.code === this.currentLang()) ?? SUPPORTED_LANGUAGES[0];
    }

    /** Locale for number, currency and date formatting in the current language. */
    get locale(): string {
        return this.current.locale;
    }

    /**
     * Builds a translated value once per language and reuses it, so templates can
     * iterate over translated option lists without getting a new array every check.
     */
    cached<T>(key: string, build: () => T): T {
        const hit = this.cache.get(key);
        if (hit && hit.lang === this.currentLang()) return hit.value as T;
        const value = build();
        // Tablo henüz yüklenmediyse çeviriler anahtar olarak döner; önbelleğe alma.
        if (this.tables()[this.currentLang()]) this.cache.set(key, { lang: this.currentLang(), value });
        return value;
    }

    /** Short month names (Jan…Dec) in the current language. */
    monthNamesShort(): string[] {
        const fmt = new Intl.DateTimeFormat(this.locale, { month: 'short' });
        return Array.from({ length: 12 }, (_, m) => fmt.format(new Date(2024, m, 1)));
    }

    private applyDocumentLang() {
        const html = this.document.documentElement;
        html.lang = this.currentLang();
        html.dir = this.current.dir;
    }
}
