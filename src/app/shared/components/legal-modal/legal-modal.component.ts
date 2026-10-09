import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../core/services/language.service';
import { LEGAL_DOCS, LegalDocType, legalDoc } from '../../../core/constants/legal.constant';
import { LegalDocumentComponent } from '../legal-document/legal-document.component';

export type { LegalDocType } from '../../../core/constants/legal.constant';

@Component({
    selector: 'app-legal-modal',
    standalone: true,
    imports: [CommonModule, LegalDocumentComponent],
    template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div class="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden">
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary text-2xl">verified_user</span>
                    <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ lang.t('legalDoc.modalTitle') }}</h3>
                </div>
                <button (click)="close()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors">
                    <span class="material-symbols-outlined text-xl">close</span>
                </button>
            </div>

            <!-- Tabs -->
            <div class="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-800/50 overflow-x-auto whitespace-nowrap">
                <button *ngFor="let tab of tabs" type="button" (click)="activeTab = tab.type"
                    [class.border-primary]="activeTab === tab.type"
                    [class.text-primary]="activeTab === tab.type"
                    [class.border-transparent]="activeTab !== tab.type"
                    class="py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-colors cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                    {{ lang.t(tab.labelKey) }}
                </button>
            </div>

            <!-- Content Area -->
            <div class="flex-1 overflow-y-auto p-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <app-legal-document [type]="activeTab"></app-legal-document>
            </div>

            <!-- Footer -->
            <div class="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
                <a [href]="'/' + currentPath" target="_blank" rel="noopener" class="text-xs text-primary hover:underline">{{ lang.t('legal.openFullPage') }}</a>
                <button (click)="close()" class="px-5 py-2 rounded-xl bg-primary text-white font-medium text-xs sm:text-sm hover:bg-blue-700 transition-colors">
                    {{ lang.t('legalDoc.closeBtn') }}
                </button>
            </div>
        </div>
    </div>
    `
})
export class LegalModalComponent {
    @Input() isOpen = false;
    @Input() activeTab: LegalDocType = 'terms';
    @Output() closed = new EventEmitter<void>();
    lang = inject(LanguageService);

    /** Sekme adları modalda daha kısa tutulur. */
    readonly tabs = LEGAL_DOCS.map(d => ({
        type: d.type,
        labelKey: ({ privacy: 'legalDoc.privacyTab', sales: 'legalDoc.salesTab', cookies: 'legalDoc.cookiesTab' } as Record<string, string>)[d.type] ?? d.labelKey
    }));

    get currentPath(): string {
        return legalDoc(this.activeTab).path;
    }

    close(): void {
        this.isOpen = false;
        this.closed.emit();
    }
}
