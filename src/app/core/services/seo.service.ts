import { Injectable, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { LanguageService } from './language.service';

const OG_LOCALES: Record<string, string> = {
    tr: 'tr_TR', en: 'en_GB', de: 'de_DE', fr: 'fr_FR', es: 'es_ES', it: 'it_IT', nl: 'nl_NL', ar: 'ar_AE'
};

/**
 * Her rotada sayfa başlığını, meta açıklamayı, Open Graph/Twitter etiketlerini ve canonical adresi günceller.
 * Rota verisi: `seo` (seo.<anahtar>.title / .description çevirileri) ve isteğe bağlı `noindex`.
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

        this.title.setTitle(fullTitle);
        this.meta.updateTag({ name: 'description', content: description });
        this.meta.updateTag({ name: 'robots', content: data['noindex'] ? 'noindex, nofollow' : 'index, follow' });
        this.meta.updateTag({ property: 'og:title', content: fullTitle });
        this.meta.updateTag({ property: 'og:description', content: description });
        this.meta.updateTag({ property: 'og:url', content: url });
        this.meta.updateTag({ property: 'og:locale', content: OG_LOCALES[this.lang.lang] ?? 'tr_TR' });
        this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
        this.meta.updateTag({ name: 'twitter:description', content: description });
        this.setCanonical(url);
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

    private canonicalUrl(): string {
        const origin = this.document.location?.origin ?? '';
        const path = this.router.url.split(/[?#]/)[0];
        return origin + (path === '/' ? '/' : path);
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
