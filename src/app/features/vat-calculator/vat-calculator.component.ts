import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LanguageService, Language } from '../../core/services/language.service';
import { COUNTRIES_CONFIG, COUNTRY_MAP, CountryConfig } from '../../core/constants/countries.constant';
import { COUNTRY_GUIDES } from '../../core/constants/country-guides.constant';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';

/** Arayüz diline göre ilk açılışta seçili ülke. */
const COUNTRY_BY_LANG: Record<Language, string> = { tr: 'TR', en: 'UK', de: 'DE', fr: 'FR', es: 'ES', it: 'IT', nl: 'NL', ar: 'AE' };

/** Ücretsiz KDV/VAT hesaplayıcı (ör. /tr/tools/vat-calculator): net ↔ brüt, 11 ülkenin oranlarıyla. */
@Component({
    selector: 'app-vat-calculator',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, LanguageSwitcherComponent, SiteFooterComponent],
    templateUrl: './vat-calculator.component.html'
})
export class VatCalculatorComponent {
    lang = inject(LanguageService);
    private router = inject(Router);

    readonly countries = COUNTRIES_CONFIG;
    readonly guides = COUNTRY_GUIDES;
    readonly countryCode = signal(COUNTRY_BY_LANG[this.lang.lang]);
    readonly country = computed<CountryConfig>(() => COUNTRY_MAP[this.countryCode()]);
    readonly rate = signal(this.country().defaultRate);
    readonly amount = signal<number | null>(1000);
    /** add: tutar vergisiz (net), vergi eklenir · remove: tutar vergi dahil (brüt), vergi ayrılır. */
    readonly mode = signal<'add' | 'remove'>('add');

    readonly result = computed(() => {
        const amount = Number(this.amount()) || 0;
        const r = this.rate() / 100;
        const net = this.mode() === 'add' ? amount : amount / (1 + r);
        const gross = this.mode() === 'add' ? amount * (1 + r) : amount;
        return { net, tax: gross - net, gross };
    });

    setCountry(code: string): void {
        this.countryCode.set(code);
        this.rate.set(COUNTRY_MAP[code].defaultRate);
    }

    money(value: number): string {
        return new Intl.NumberFormat(this.lang.locale, { style: 'currency', currency: this.country().currency }).format(value);
    }

    otherRates(c: CountryConfig): string {
        const others = [...new Set(c.rates.map(r => r.rate).filter(r => r !== c.defaultRate))];
        return others.length ? others.map(r => this.pct(r)).join(', ') : '–';
    }

    pct(rate: number): string {
        return this.lang.t('guide.ratePct', { rate });
    }

    guideSlug(code: string): string | undefined {
        return COUNTRY_GUIDES.find(g => g.code === code)?.slug;
    }

    createInvoice(): void {
        this.router.navigate(['/create-invoice'], { queryParams: { taxRate: this.rate(), countryCode: this.countryCode() } });
    }
}
