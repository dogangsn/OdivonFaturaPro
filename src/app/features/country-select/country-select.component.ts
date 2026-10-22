import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { User } from '@angular/fire/auth';
import { COUNTRIES_CONFIG, CountryConfig } from '../../core/constants/countries.constant';
import { COUNTRY_GUIDES, countryGuide } from '../../core/constants/country-guides.constant';
import { HOME_FAQ } from '../../core/constants/home.constant';
import { ARTICLES } from '../../core/constants/articles.constant';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';
import { AnalyticsService } from '../../core/services/analytics.service';
import { FeedbackWidgetComponent } from '../../shared/components/feedback-widget/feedback-widget.component';

@Component({
    selector: 'app-country-select',
    standalone: true,
    imports: [CommonModule, RouterModule, SiteFooterComponent, LanguageSwitcherComponent, FeedbackWidgetComponent],
    templateUrl: './country-select.component.html',
    styleUrl: './country-select.component.css'
})
export class CountrySelectComponent implements OnInit {
    private router = inject(Router);
    private auth = inject(Auth);
    private authService = inject(AuthService);
    private platformId = inject(PLATFORM_ID);
    private analytics = inject(AnalyticsService);
    lang = inject(LanguageService);

    user = signal<User | null>(null);
    isLoggedIn = signal(false);
    isLoading = signal(true);

    countries: CountryConfig[] = COUNTRIES_CONFIG;

    readonly articles = ARTICLES;
    readonly guides = COUNTRY_GUIDES.map(g => countryGuide(g.slug)!);
    readonly faq = HOME_FAQ;

    readonly features = [
        { icon: 'account_balance', title: 'home.f1Title', text: 'home.f1Text' },
        { icon: 'language', title: 'home.f2Title', text: 'home.f2Text' },
        { icon: 'picture_as_pdf', title: 'home.f3Title', text: 'home.f3Text' },
        { icon: 'insights', title: 'home.f4Title', text: 'home.f4Text' },
    ];

    async ngOnInit() {
        if (isPlatformBrowser(this.platformId)) {
            // Auth state'inin yüklenmesini bekle
            await this.auth.authStateReady();
            
            this.user.set(this.auth.currentUser);
            this.isLoggedIn.set(!!this.auth.currentUser);
            this.isLoading.set(false);

            // Auth değişikliklerini dinle
            this.authService.user$.subscribe(firebaseUser => {
                this.user.set(firebaseUser);
                this.isLoggedIn.set(!!firebaseUser);
            });
        } else {
            this.isLoading.set(false);
        }
    }

    selectCountry(country: CountryConfig) {
        this.analytics.event('select_country', { country: country.code });
        this.router.navigate(['/create-invoice'], { queryParams: { taxRate: country.defaultRate, countryCode: country.code } });
    }

    goToLogin() {
        this.router.navigate(['/login']);
    }

    goToPricing() {
        this.router.navigate(['/pricing']);
    }

    goToRegister() {
        this.router.navigate(['/login'], { queryParams: { mode: 'register' } });
    }

    goToDashboard() {
        this.router.navigate(['/dashboard']);
    }

    logout() {
        this.authService.logout();
    }
}
