import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LanguageService } from '../../../core/services/language.service';
import { CookieConsentService } from '../../../core/services/cookie-consent.service';

/**
 * KVKK çerez rehberine uygun onay bandı: kabul ve ret eşit ağırlıkta, reklam çerezi varsayılan kapalı.
 * Karar verilene kadar reklam betiği yüklenmez (bkz. AdSlotComponent).
 */
@Component({
    selector: 'app-cookie-banner',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div *ngIf="consent.bannerOpen()" role="dialog" aria-live="polite" [attr.aria-label]="lang.t('cookie.title')"
        class="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4 pointer-events-none">
        <div class="pointer-events-auto mx-auto max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-4 sm:p-5 text-slate-700 dark:text-slate-200">
            <div class="flex items-start gap-3">
                <span class="material-symbols-outlined text-primary text-2xl shrink-0" aria-hidden="true">cookie</span>
                <div class="flex-1 min-w-0">
                    <h2 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white">{{ lang.t('cookie.title') }}</h2>
                    <p class="mt-1 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {{ lang.t('cookie.text') }}
                        <a routerLink="/cerez-politikasi" class="text-primary underline hover:text-blue-700">{{ lang.t('legal.cookiePolicy') }}</a>
                    </p>
                </div>
            </div>

            <div *ngIf="showDetails" class="mt-4 space-y-2">
                <div class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                    <div>
                        <p class="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">{{ lang.t('cookie.necessaryTitle') }}</p>
                        <p class="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">{{ lang.t('cookie.necessaryDesc') }}</p>
                    </div>
                    <span class="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">{{ lang.t('cookie.alwaysOn') }}</span>
                </div>
                <label class="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 p-3 cursor-pointer">
                    <div>
                        <p class="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">{{ lang.t('cookie.adsTitle') }}</p>
                        <p class="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">{{ lang.t('cookie.adsDesc') }}</p>
                    </div>
                    <input type="checkbox" name="adsConsent" [checked]="adsChoice" (change)="adsChoice = $any($event.target).checked"
                        class="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary shrink-0">
                </label>
            </div>

            <div class="mt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
                <button *ngIf="!showDetails" type="button" (click)="showDetails = true"
                    class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary">
                    {{ lang.t('cookie.customize') }}
                </button>
                <button *ngIf="showDetails" type="button" (click)="consent.save(adsChoice)"
                    class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary">
                    {{ lang.t('cookie.save') }}
                </button>
                <!-- Ret ve kabul aynı görünürlükte olmalı -->
                <button type="button" (click)="consent.rejectAll()"
                    class="px-4 py-2 rounded-xl border-2 border-primary text-primary text-xs sm:text-sm font-semibold hover:bg-primary/5">
                    {{ lang.t('cookie.rejectAll') }}
                </button>
                <button type="button" (click)="consent.acceptAll()"
                    class="px-4 py-2 rounded-xl border-2 border-primary bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-blue-700">
                    {{ lang.t('cookie.acceptAll') }}
                </button>
            </div>
        </div>
    </div>
    `
})
export class CookieBannerComponent {
    lang = inject(LanguageService);
    consent = inject(CookieConsentService);
    showDetails = false;
    adsChoice = false;

    constructor() {
        // Tercihler yeniden açıldığında mevcut kararı göster.
        effect(() => {
            if (this.consent.bannerOpen()) {
                const current = this.consent.consent();
                this.adsChoice = current?.ads ?? false;
                this.showDetails = current !== null;
            }
        });
    }
}
