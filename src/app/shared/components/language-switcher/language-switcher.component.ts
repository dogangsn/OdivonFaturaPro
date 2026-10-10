import { Component, ElementRef, HostListener, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Language, LanguageService } from '../../../core/services/language.service';

@Component({
    selector: 'app-language-switcher',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="relative" [class.w-full]="fullWidth">
            <button type="button" (click)="open = !open"
                class="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                [class.w-full]="fullWidth" [attr.aria-expanded]="open" aria-haspopup="listbox">
                <img [src]="lang.current.flagUrl" alt="" class="w-5 h-3.5 rounded-sm object-cover">
                <span class="flex-1 text-start">{{ lang.current.nativeName }}</span>
                <span class="material-symbols-outlined text-[18px] text-slate-400">expand_more</span>
            </button>
            <ul *ngIf="open" role="listbox"
                class="absolute z-50 min-w-full w-44 max-h-80 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1 end-0"
                [ngClass]="direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'">
                <li *ngFor="let l of lang.languages">
                    <button type="button" role="option" [attr.aria-selected]="l.code === lang.lang" (click)="select(l.code)"
                        class="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-start hover:bg-slate-100 dark:hover:bg-slate-800"
                        [ngClass]="l.code === lang.lang ? 'text-primary font-semibold' : 'text-slate-700 dark:text-slate-200'">
                        <img [src]="l.flagUrl" alt="" class="w-5 h-3.5 rounded-sm object-cover">
                        <span class="flex-1">{{ l.nativeName }}</span>
                        <span *ngIf="l.code === lang.lang" class="material-symbols-outlined text-[16px]">check</span>
                    </button>
                </li>
            </ul>
        </div>
    `
})
export class LanguageSwitcherComponent {
    lang = inject(LanguageService);
    private host = inject(ElementRef);
    private router = inject(Router);

    @Input() direction: 'up' | 'down' = 'down';
    @Input() fullWidth = false;

    open = false;

    select(code: Language) {
        this.lang.setLanguage(code);
        // Adres ?lang= taşıyorsa onu da güncelle; yoksa yenilemede eski dil geri gelir.
        if (this.router.parseUrl(this.router.url).queryParamMap.has('lang')) {
            this.router.navigate([], { queryParams: { lang: code }, queryParamsHandling: 'merge', replaceUrl: true });
        }
        this.open = false;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        if (!this.host.nativeElement.contains(event.target)) {
            this.open = false;
        }
    }
}
