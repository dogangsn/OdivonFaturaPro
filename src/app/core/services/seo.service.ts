import { Injectable, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { LanguageService, SUPPORTED_LANGUAGES, isLanguage } from './language.service';
import { COUNTRIES_CONFIG } from '../constants/countries.constant';

const OG_LOCALES: Record<string, string> = {
    tr: 'tr_TR', en: 'en_GB', de: 'de_DE', fr: 'fr_FR', es: 'es_ES', it: 'it_IT', nl: 'nl_NL', ar: 'ar_AE'
};

// Uygulamanın fatura kestiği ülkeler (ISO 3166-1; listede İngiltere 'UK' olarak geçer).
const AREA_SERVED = COUNTRIES_CONFIG.map(c => (c.code === 'UK' ? 'GB' : c.code));

/**
 * Her rotada sayfa başlığını, meta açıklamayı, Open Graph/Twitter etiketlerini ve canonical adresi günceller.
 * Rota verisi: `seo` (seo.<anahtar>.title / .description çevirileri) ve isteğe bağlı `noindex`.
 * Dizine açık sayfalara her dil için hreflang bağlantısı (?lang=xx, x-default: parametresiz adres) ekler;
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
        const data = this.deepestData(this.router.routerState.snapshot.root);
        const key: string = data['seo'] ?? 'home';
        const siteName = this.lang.t('seo.siteName');

        const pageTitle = this.translated(`seo.${key}.title`);
        const fullTitle = key === 'home' || !pageTitle ? this.lang.t('seo.home.title') : `${pageTitle} | ${siteName}`;
        const description = this.translated(`seo.${key}.description`) ?? this.lang.t('seo.home.description');
        const url = this.canonicalUrl();
        const indexable = !data['noindex'];

        this.title.setTitle(fullTitle);
        this.meta.updateTag({ name: 'description', content: description });
        this.meta.updateTag({ name: 'robots', content: data['noindex'] ? 'noindex, nofollow' : 'index, follow' });
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
        this.setAlternates(indexable ? this.pageUrl() : null);
        this.setStructuredData(key === 'home' && indexable ? this.homeSchema(description) : null);
    }

    /** Çevirisi yoksa undefined (t() anahtarın kendisini döndürür). */
    private translated(key: string): string | undefined {
        const value = this.lang.t(key);
        return value === key ? undefined : value;
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

    /** Parametresiz sayfa adresi; x-default ve dil sürümlerinin tabanı. */
    private pageUrl(): string {
        const origin = this.document.location?.origin ?? '';
        return origin + this.router.url.split(/[?#]/)[0];
    }

    /** Kendine işaret eden canonical: dil sürümü (?lang=xx) açıldıysa o sürüm, yoksa parametresiz adres. */
    private canonicalUrl(): string {
        const lang = this.router.parseUrl(this.router.url).queryParamMap.get('lang');
        return isLanguage(lang) ? `${this.pageUrl()}?lang=${this.lang.lang}` : this.pageUrl();
    }

    private setAlternates(baseUrl: string | null): void {
        this.document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link => link.remove());
        if (!baseUrl) return;
        const links = [
            ...SUPPORTED_LANGUAGES.map(l => ({ hreflang: l.code, href: `${baseUrl}?lang=${l.code}` })),
            { hreflang: 'x-default', href: baseUrl }
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
        const origin = this.document.location?.origin ?? '';
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
