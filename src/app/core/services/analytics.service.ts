import { Injectable, PLATFORM_ID, effect, inject } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CookieConsentService } from './cookie-consent.service';

type Gtag = (...args: unknown[]) => void;

/**
 * Google Analytics 4 (gtag.js). Betik yalnızca canlı ortamda ve kullanıcı analitik çerezlerine onay verdiyse yüklenir;
 * onay geri alınırsa ölçüm durur ve _ga çerezleri silinir. Sayfa görüntülemeleri rota değişiminde elle gönderilir.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
    private document = inject(DOCUMENT);
    private consent = inject(CookieConsentService);
    private router = inject(Router);
    private readonly enabled = isPlatformBrowser(inject(PLATFORM_ID)) && environment.production;
    private readonly id = environment.firebase.measurementId;
    private loaded = false;
    private lastPage = '';

    constructor() {
        if (!this.enabled) return;
        effect(() => (this.consent.analyticsAllowed() ? this.start() : this.stop()));
        this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.pageView());
    }

    /** Ölçüm açıksa olay gönderir (ör. sign_up, create_invoice); kapalıysa hiçbir şey yapmaz. */
    event(name: string, params: Record<string, string | number | boolean | undefined> = {}): void {
        if (this.active) this.gtag?.('event', name, params);
    }

    private get active(): boolean {
        return this.enabled && this.loaded && this.consent.analyticsAllowed();
    }

    private get gtag(): Gtag | undefined {
        return (this.document.defaultView as unknown as { gtag?: Gtag } | null)?.gtag;
    }

    private start(): void {
        const win = this.document.defaultView as any;
        if (!win) return;
        win[`ga-disable-${this.id}`] = false;
        if (!this.loaded) {
            win.dataLayer = win.dataLayer || [];
            win.gtag = function () {
                // gtag.js arguments nesnesini bekler.
                // eslint-disable-next-line prefer-rest-params
                win.dataLayer.push(arguments);
            };
            win.gtag('js', new Date());
            win.gtag('config', this.id, { send_page_view: false });
            const script = this.document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${this.id}`;
            this.document.head.appendChild(script);
            this.loaded = true;
        }
        this.pageView();
    }

    private stop(): void {
        const win = this.document.defaultView as any;
        if (!win) return;
        win[`ga-disable-${this.id}`] = true;
        // Daha önce bırakılmış _ga çerezlerini her alan adı düzeyinde sil.
        const host = win.location.hostname as string;
        const domains = ['', host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`];
        for (const name of this.document.cookie.split(';').map(c => c.split('=')[0].trim()).filter(n => n === '_ga' || n.startsWith('_ga_'))) {
            for (const domain of domains) {
                this.document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? `; domain=${domain}` : ''}`;
            }
        }
    }

    private pageView(): void {
        // Başlık SeoService tarafından aynı NavigationEnd'de güncellenir; bir tur bekleyip güncel başlığı gönder.
        // Açılışta hem onay hem ilk gezinme tetikler; aynı adres iki kez sayılmaz.
        setTimeout(() => {
            const href = this.document.location.href;
            if (!this.active || href === this.lastPage) return;
            this.lastPage = href;
            this.event('page_view', { page_location: href, page_title: this.document.title, language: this.document.documentElement.lang });
        });
    }
}
