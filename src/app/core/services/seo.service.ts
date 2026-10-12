import { Injectable, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { LanguageService, SUPPORTED_LANGUAGES, isLanguage, langFromPath } from './language.service';
import { SITE_URL } from '../constants/site.constant';
import { COUNTRIES_CONFIG } from '../constants/countries.constant';
import { countryGuide } from '../constants/country-guides.constant';
import { HOME_FAQ } from '../constants/home.constant';

const OG_LOCALES: Record<string, string> = {
    tr: 'tr_TR', en: 'en_GB', de: 'de_DE', fr: 'fr_FR', es: 'es_ES', it: 'it_IT', nl: 'nl_NL', ar: 'ar_AE'
};

// Uygulamanın fatura kestiği ülkeler (ISO 3166-1; listede İngiltere 'UK' olarak geçer).
const AREA_SERVED = COUNTRIES_CONFIG.map(c => (c.code === 'UK' ? 'GB' : c.code));

/**
 * Her rotada sayfa başlığını, meta açıklamayı, Open Graph/Twitter etiketlerini ve canonical adresi günceller.
 * Rota verisi: `seo` (seo.<anahtar>.title / .description çevirileri) ve isteğe bağlı `noindex`.
 * Dizine açık sayfalara her dil için hreflang bağlantısı ekler: `localized` sayfalarda dil önekli adres (/de/...),
 * diğerlerinde ?lang=xx; x-default önieksiz, parametresiz adrestir.
 * ana sayfaya yapılandırılmış veri (JSON-LD) koyar.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
    private router = inject(Router);
    private title = inject(Title);
    private meta = inject(Meta);
    private document = inject(DOCUMENT);
    private lang = inject(LanguageService);

    constructor() {
        this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.apply());
        // Dil değişince başlık ve açıklama da o dile geçsin.
        effect(() => {
            this.lang.currentLang();
            this.apply();
        });
    }

    apply(): void {
        // Dil önekli sayfaya uygulama içinden geçildiyse arayüz de o dile geçer (effect apply'ı yeniden çağırır).
        const pathLang = langFromPath(this.router.url);
        if (pathLang && pathLang !== this.lang.lang) {
            this.lang.setLanguage(pathLang);
            return;
        }
        const data = this.deepestData(this.router.routerState.snapshot.root);
        let key: string = data['seo'] ?? 'home';
        const siteName = this.lang.t('seo.siteName');

        // Ülke rehberi: başlık ve açıklama ülke adı/vergi adıyla doldurulur; bilinmeyen ülke dizine girmez.
        const guide = key === 'countryGuide' ? countryGuide(this.deepestParam('country')) : undefined;
        if (key === 'countryGuide' && !guide) key = 'notFound';
        const params = guide
            ? { country: this.lang.t(guide.country.nameKey), tax: guide.country.taxLabel, currency: guide.country.currency }
            : undefined;

        const pageTitle = this.translated(`seo.${key}.title`, params);
        const fullTitle = key === 'home' || !pageTitle ? this.lang.t('seo.home.title') : `${pageTitle} | ${siteName}`;
        const description = this.translated(`seo.${key}.description`, params) ?? this.lang.t('seo.home.description');
        const localized = !!data['localized'];
        const url = this.canonicalUrl(localized);
        const indexable = !data['noindex'] && key !== 'notFound';

        this.title.setTitle(fullTitle);
        this.meta.updateTag({ name: 'description', content: description });
        this.meta.updateTag({ name: 'robots', content: indexable ? 'index, follow' : 'noindex, nofollow' });
        this.meta.updateTag({ property: 'og:title', content: fullTitle });
        this.meta.updateTag({ property: 'og:description', content: description });
        this.meta.updateTag({ property: 'og:url', content: url });
        this.meta.updateTag({ property: 'og:locale', content: OG_LOCALES[this.lang.lang] ?? 'en_GB' });
        this.meta.getTags('property="og:locale:alternate"').forEach(tag => this.meta.removeTagElement(tag));
        this.meta.addTags(Object.entries(OG_LOCALES)
            .filter(([code]) => code !== this.lang.lang)
            .map(([, locale]) => ({ property: 'og:locale:alternate', content: locale })));
        this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
        this.meta.updateTag({ name: 'twitter:description', content: description });
        this.setCanonical(url);
        this.setAlternates(indexable ? this.basePath() : null, localized);
        this.setStructuredData(key === 'home' && indexable ? this.homeSchema(description) : null);
    }

    /** Çevirisi yoksa undefined (t() anahtarın kendisini döndürür). */
    private translated(key: string, params?: Record<string, string>): string | undefined {
        const value = this.lang.t(key, params);
        return value === key ? undefined : value;
    }

    private deepestParam(name: string): string | null {
        let route: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
        let value: string | null = null;
        while (route) {
            value = route.paramMap.get(name) ?? value;
            route = route.firstChild;
        }
        return value;
    }

    private deepestData(route: ActivatedRouteSnapshot): Record<string, any> {
        let data = { ...route.data };
        let child = route.firstChild;
        while (child) {
            data = { ...data, ...child.data };
            child = child.firstChild;
        }
        return data;
    }

    /** Dil öneki ve parametreler olmadan sayfa yolu ('' = ana sayfa, 'invoice/germany'). */
    private basePath(): string {
        const segments = this.router.url.split(/[?#]/)[0].split('/').filter(Boolean);
        if (isLanguage(segments[0])) segments.shift();
        return segments.join('/');
    }

    /** Bir dil sürümünün tam adresi; `lang` yoksa x-default (önieksiz, parametresiz). */
    private versionUrl(path: string, localized: boolean, lang?: string): string {
        if (!lang) return `${SITE_URL}/${path}`;
        if (localized) return `${SITE_URL}/${lang}${path ? '/' + path : ''}`;
        return `${SITE_URL}/${path}?lang=${lang}`;
    }

    /**
     * Kendine işaret eden canonical. Dil önekli adres ya da ?lang=xx ile açılan sayfa o dil sürümünü gösterir
     * (localized sayfalarda ?lang=xx, önekli /xx/ sürümüne bağlanır); ikisi de yoksa önieksiz adres.
     */
    private canonicalUrl(localized: boolean): string {
        const query = this.router.parseUrl(this.router.url).queryParamMap.get('lang');
        const chosen = langFromPath(this.router.url) ?? (isLanguage(query) ? this.lang.lang : undefined);
        return this.versionUrl(this.basePath(), localized, chosen);
    }

    private setAlternates(path: string | null, localized: boolean): void {
        this.document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link => link.remove());
        if (path === null) return;
        const links = [
            ...SUPPORTED_LANGUAGES.map(l => ({ hreflang: l.code, href: this.versionUrl(path, localized, l.code) })),
            { hreflang: 'x-default', href: this.versionUrl(path, localized) }
        ];
        for (const { hreflang, href } of links) {
            const link = this.document.createElement('link');
            link.rel = 'alternate';
            link.hreflang = hreflang;
            link.href = href;
            this.document.head.appendChild(link);
        }
    }

    private homeSchema(description: string): object {
        const origin = SITE_URL;
        const languages = SUPPORTED_LANGUAGES.map(l => l.code);
        return {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'WebSite',
                    '@id': `${origin}/#website`,
                    url: `${origin}/`,
                    name: this.lang.t('seo.siteName'),
                    inLanguage: languages
                },
                {
                    '@type': 'SoftwareApplication',
                    name: this.lang.t('seo.siteName'),
                    url: `${origin}/`,
                    description,
                    applicationCategory: 'BusinessApplication',
                    operatingSystem: 'Web',
                    image: `${origin}/odivon-violet-loop.png`,
                    inLanguage: this.lang.lang,
                    availableLanguage: languages,
                    areaServed: AREA_SERVED,
                    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
                },
                {
                    '@type': 'FAQPage',
                    inLanguage: this.lang.lang,
                    mainEntity: HOME_FAQ.map(n => ({
                        '@type': 'Question',
                        name: this.lang.t(`home.faq.q${n}`),
                        acceptedAnswer: { '@type': 'Answer', text: this.lang.t(`home.faq.a${n}`) }
                    }))
                }
            ]
        };
    }

    private setStructuredData(schema: object | null): void {
        let script = this.document.getElementById('seo-jsonld');
        if (!schema) {
            script?.remove();
            return;
        }
        if (!script) {
            script = this.document.createElement('script');
            script.id = 'seo-jsonld';
            script.setAttribute('type', 'application/ld+json');
            this.document.head.appendChild(script);
        }
        script.textContent = JSON.stringify(schema);
    }

    private setCanonical(url: string): void {
        let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
        if (!link) {
            link = this.document.createElement('link');
            link.rel = 'canonical';
            this.document.head.appendChild(link);
        }
        link.href = url;
    }
}
