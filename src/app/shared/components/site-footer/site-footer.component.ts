import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LanguageService } from '../../../core/services/language.service';
import { CookieConsentService } from '../../../core/services/cookie-consent.service';
import { LEGAL_DOCS } from '../../../core/constants/legal.constant';

/** Yasal metin bağlantıları, çerez tercihleri ve telif satırı. */
@Component({
    selector: 'app-site-footer',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <footer [class]="'text-center text-xs text-slate-400 space-y-2 ' + (compact ? 'py-4' : 'py-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900')">
        <nav [attr.aria-label]="lang.t('legal.otherDocs')" class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4">
            <a *ngFor="let doc of docs" [routerLink]="'/' + doc.path" class="hover:text-primary transition-colors">{{ lang.t(doc.labelKey) }}</a>
            <button type="button" (click)="consent.openPreferences()" class="hover:text-primary transition-colors bg-transparent border-0 p-0 cursor-pointer">{{ lang.t('legal.cookieSettings') }}</button>
        </nav>
        <p>{{ lang.t('legal.copyright') }}</p>
    </footer>
    `,
    styles: [`:host { display: block; }`]
})
export class SiteFooterComponent {
    /** Panel içinde kenarlıksız, küçük görünüm. */
    @Input() compact = false;
    lang = inject(LanguageService);
    consent = inject(CookieConsentService);
    readonly docs = LEGAL_DOCS;
}
