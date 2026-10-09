import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../core/services/language.service';
import { BUSINESS } from '../../../core/constants/business.constant';
import { LegalDocType, legalDoc } from '../../../core/constants/legal.constant';

/** Bir yasal metnin başlık, giriş ve bölümlerini çevrili olarak gösterir (modal ve tam sayfa ortak). */
@Component({
    selector: 'app-legal-document',
    standalone: true,
    imports: [CommonModule],
    template: `
    <article class="space-y-3">
        <h2 *ngIf="showTitle" class="font-bold text-slate-900 dark:text-white text-base">{{ lang.t(prefix + 'title') }}</h2>
        <p>{{ lang.t(prefix + 'intro', sellerParams) }}</p>
        <section *ngFor="let n of sectionNumbers">
            <h3 class="font-semibold text-slate-800 dark:text-slate-100 mt-4 mb-1">{{ lang.t(prefix + 'h' + n) }}</h3>
            <p class="whitespace-pre-line">{{ lang.t(prefix + 'p' + n, sellerParams) }}</p>
        </section>
    </article>
    `
})
export class LegalDocumentComponent {
    @Input({ required: true }) type!: LegalDocType;
    @Input() showTitle = true;
    lang = inject(LanguageService);

    get prefix(): string {
        return `legalDoc.${this.type}.`;
    }

    get sectionNumbers(): number[] {
        return Array.from({ length: legalDoc(this.type).sections }, (_, i) => i + 1);
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
}
