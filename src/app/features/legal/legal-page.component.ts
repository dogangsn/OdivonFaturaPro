import { Component, inject } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { LanguageService } from '../../core/services/language.service';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { LegalDocumentComponent } from '../../shared/components/legal-document/legal-document.component';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';
import { LEGAL_LAST_UPDATED, LegalDocType } from '../../core/constants/legal.constant';

/** Yasal metinlerin herkese açık, bağlantı verilebilir sayfası (ör. /gizlilik-politikasi). */
@Component({
    selector: 'app-legal-page',
    standalone: true,
    imports: [CommonModule, RouterModule, LanguageSwitcherComponent, LegalDocumentComponent, SiteFooterComponent],
    template: `
    <div class="min-h-screen min-h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950">
        <header class="flex items-center justify-between px-4 sm:px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <a routerLink="/" class="flex items-center gap-2 text-primary" [attr.aria-label]="lang.t('legal.backHome')">
                <img src="/odivon-violet-loop.png" alt="" class="w-8 h-8 object-contain">
                <span class="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">Odivon <span class="text-primary">FaturaPro</span></span>
            </a>
            <app-language-switcher></app-language-switcher>
        </header>

        <main class="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
            <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{{ lang.t('legalDoc.' + type() + '.title') }}</h1>
            <p class="mt-1 mb-6 text-xs text-slate-400">{{ lang.t('legal.lastUpdated', { date: lastUpdated() }) }}</p>
            <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-8 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <app-legal-document [type]="type()" [showTitle]="false"></app-legal-document>
            </div>
        </main>

        <app-site-footer></app-site-footer>
    </div>
    `
})
export class LegalPageComponent {
    lang = inject(LanguageService);
    private route = inject(ActivatedRoute);
    readonly type = toSignal(this.route.data.pipe(map(d => d['legalDoc'] as LegalDocType)), {
        initialValue: this.route.snapshot.data['legalDoc'] as LegalDocType
    });

    lastUpdated(): string {
        return formatDate(LEGAL_LAST_UPDATED, 'longDate', this.lang.locale);
    }
}
