import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { CookieBannerComponent } from './shared/components/cookie-banner/cookie-banner.component';
import { SeoService } from './core/services/seo.service';
import { AnalyticsService } from './core/services/analytics.service';


@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterOutlet, CookieBannerComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent {
    title = 'OdivonFaturaPro';
    // Sayfa başlığı ve meta etiketleri her gezinmede güncellenir.
    private seo = inject(SeoService);
    // Ziyaret istatistikleri yalnızca analitik çerez onayıyla.
    private analytics = inject(AnalyticsService);
}
