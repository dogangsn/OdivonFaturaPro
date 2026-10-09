import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface CookieConsent {
    /** Google AdSense reklam ve ölçüm çerezleri (yalnızca ücretsiz planda kullanılır). */
    ads: boolean;
    /** Kararın verildiği an (ISO). */
    decidedAt: string;
    version: number;
}

export const COOKIE_CONSENT_KEY = 'cookieConsent';
/** Çerez kategorileri değişirse artırın; eski kararlar geçersiz sayılır ve banner yeniden çıkar. */
export const COOKIE_CONSENT_VERSION = 1;
/** KVKK Kurulu çerez rehberine uygun olarak karar 12 ay sonra yeniden sorulur. */
const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Kullanıcının çerez tercihini tutar. Zorunlu çerezler her zaman açıktır;
 * reklam çerezleri yalnızca açık onayla açılır, karar verilmeden hiçbir reklam betiği yüklenmez.
 */
@Injectable({ providedIn: 'root' })
export class CookieConsentService {
    private platformId = inject(PLATFORM_ID);

    readonly consent = signal<CookieConsent | null>(this.read());
    /** Banner açık mı: karar yoksa ya da kullanıcı tercihleri yeniden açtıysa. */
    readonly bannerOpen = signal(isPlatformBrowser(this.platformId) && this.consent() === null);
    readonly adsAllowed = computed(() => this.consent()?.ads === true);

    acceptAll(): void {
        this.save(true);
    }

    rejectAll(): void {
        this.save(false);
    }

    save(ads: boolean): void {
        const consent: CookieConsent = { ads, decidedAt: new Date().toISOString(), version: COOKIE_CONSENT_VERSION };
        try {
            localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
        } catch {
            // Depolama kapalıysa karar bu oturum için geçerli olur.
        }
        this.consent.set(consent);
        this.bannerOpen.set(false);
    }

    /** Alt bilgideki "Çerez Tercihleri" bağlantısı. */
    openPreferences(): void {
        this.bannerOpen.set(true);
    }

    private read(): CookieConsent | null {
        if (!isPlatformBrowser(this.platformId)) return null;
        try {
            const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw) as CookieConsent;
            const age = Date.now() - new Date(parsed.decidedAt).getTime();
            if (parsed.version !== COOKIE_CONSENT_VERSION || !(age >= 0 && age < CONSENT_MAX_AGE_MS)) return null;
            return { ads: parsed.ads === true, decidedAt: parsed.decidedAt, version: parsed.version };
        } catch {
            return null;
        }
    }
}
