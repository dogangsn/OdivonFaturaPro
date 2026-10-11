import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { LanguageService } from '../../core/services/language.service';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';
import { COUNTRY_GUIDES, countryGuide } from '../../core/constants/country-guides.constant';

/** Ülke bazlı fatura rehberi (ör. /invoice/germany): vergi oranları, zorunlu alanlar, adımlar ve fatura oluşturma bağlantısı. */
@Component({
    selector: 'app-country-guide',
    standalone: true,
    imports: [CommonModule, RouterModule, LanguageSwitcherComponent, SiteFooterComponent],
    templateUrl: './country-guide.component.html'
})
export class CountryGuideComponent {
    lang = inject(LanguageService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    private slug = toSignal(this.route.paramMap.pipe(map(p => p.get('country'))), {
        initialValue: this.route.snapshot.paramMap.get('country')
    });
    readonly guide = computed(() => countryGuide(this.slug()));
    readonly others = computed(() => COUNTRY_GUIDES.filter(g => g.slug !== this.slug()).map(g => countryGuide(g.slug)!));
    readonly fields = ['seller', 'taxId', 'buyer', 'number', 'date', 'items', 'tax', 'total'];

    /** Çeviri parametreleri: ülke adı, vergi adı, para birimi, vergi numarası adı. */
    p(): Record<string, string> {
        const g = this.guide();
        if (!g) return {};
        return { country: this.lang.t(g.country.nameKey), tax: g.country.taxLabel, currency: g.country.currency, taxId: g.taxIdName };
    }

    createInvoice(): void {
        const c = this.guide()?.country;
        if (!c) return;
        this.router.navigate(['/create-invoice'], { queryParams: { taxRate: c.defaultRate, countryCode: c.code } });
    }
}
