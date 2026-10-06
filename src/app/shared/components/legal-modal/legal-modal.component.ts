import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../core/services/language.service';
import { BUSINESS } from '../../../core/constants/business.constant';

export type LegalDocType = 'kvkk' | 'privacy' | 'terms' | 'sales';

@Component({
    selector: 'app-legal-modal',
    standalone: true,
    imports: [CommonModule],
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
                <button (click)="activeTab = 'terms'"
                    [class.border-primary]="activeTab === 'terms'"
                    [class.text-primary]="activeTab === 'terms'"
                    [class.border-transparent]="activeTab !== 'terms'"
                    class="py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-colors cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                    {{ lang.t('legal.terms') }}
                </button>
                <button (click)="activeTab = 'privacy'"
                    [class.border-primary]="activeTab === 'privacy'"
                    [class.text-primary]="activeTab === 'privacy'"
                    [class.border-transparent]="activeTab !== 'privacy'"
                    class="py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-colors cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                    {{ lang.t('legalDoc.privacyTab') }}
                </button>
                <button (click)="activeTab = 'kvkk'"
                    [class.border-primary]="activeTab === 'kvkk'"
                    [class.text-primary]="activeTab === 'kvkk'"
                    [class.border-transparent]="activeTab !== 'kvkk'"
                    class="py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-colors cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                    {{ lang.t('legal.kvkk') }}
                </button>
                <button (click)="activeTab = 'sales'"
                    [class.border-primary]="activeTab === 'sales'"
                    [class.text-primary]="activeTab === 'sales'"
                    [class.border-transparent]="activeTab !== 'sales'"
                    class="py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-colors cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                    {{ lang.t('legalDoc.salesTab') }}
                </button>
            </div>

            <!-- Content Area -->
            <div class="flex-1 overflow-y-auto p-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-4 leading-relaxed">
                <div class="space-y-3">
                    <h4 class="font-bold text-slate-900 dark:text-white text-base">{{ lang.t('legalDoc.' + activeTab + '.title') }}</h4>
                    <p>{{ lang.t('legalDoc.' + activeTab + '.intro', sellerParams) }}</p>
                    <ng-container *ngFor="let n of sectionNumbers">
                        <h5 class="font-semibold text-slate-800 dark:text-slate-100 mt-3">{{ lang.t('legalDoc.' + activeTab + '.h' + n) }}</h5>
                        <p class="whitespace-pre-line">{{ lang.t('legalDoc.' + activeTab + '.p' + n, sellerParams) }}</p>
                    </ng-container>
                </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
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

    get sectionNumbers(): number[] {
        if (this.activeTab === 'kvkk') return [1, 2];
        if (this.activeTab === 'sales') return [1, 2, 3, 4];
        return [1, 2, 3];
    }

    /** Satıcı bilgileri; boş alanlar "belirtilecek" olarak gösterilir. */
    get sellerParams(): Record<string, string> {
        const pending = this.lang.t('legalDoc.pending');
        return {
            legalName: BUSINESS.legalName || pending,
            address: BUSINESS.address || pending,
            taxOffice: BUSINESS.taxOffice || pending,
            taxNumber: BUSINESS.taxNumber || pending,
            mersisNo: BUSINESS.mersisNo || pending,
            supportEmail: BUSINESS.supportEmail || pending
        };
    }

    close(): void {
        this.isOpen = false;
        this.closed.emit();
    }
}
