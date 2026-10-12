import { Routes } from '@angular/router';
import { CountrySelectComponent } from './features/country-select/country-select.component';
import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { LEGAL_DOCS } from './core/constants/legal.constant';
import { SUPPORTED_LANGUAGES } from './core/services/language.service';

const loadCountryGuide = () => import('./features/country-guide/country-guide.component').then(m => m.CountryGuideComponent);
const loadVatCalculator = () => import('./features/vat-calculator/vat-calculator.component').then(m => m.VatCalculatorComponent);

// Ana sayfa dışındaki sayfalar ayrı parçalar halinde yüklenir; ilk açılış küçük kalır.
// `seo`: seo.<anahtar>.title/description çevirileri (SeoService). Panel sayfaları girişe kapalı olduğundan dizine eklenmez.
export const routes: Routes = [
    // Public Routes (No Sidebar)
    { path: '', component: CountrySelectComponent, pathMatch: 'full', data: { seo: 'home', localized: true } },
    { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent), data: { seo: 'login' } },
    { path: 'create-invoice', loadComponent: () => import('./features/create-invoice/create-invoice.component').then(m => m.CreateInvoiceComponent), data: { seo: 'createInvoice' } },
    { path: 'pricing', loadComponent: () => import('./features/pricing/pricing.component').then(m => m.PricingComponent), data: { seo: 'pricing' } },

    // Ülke fatura rehberleri: /invoice/germany, /invoice/turkey ... (COUNTRY_GUIDES)
    { path: 'invoice/:country', loadComponent: loadCountryGuide, data: { seo: 'countryGuide', localized: true } },
    // Ücretsiz araçlar
    { path: 'tools/vat-calculator', loadComponent: loadVatCalculator, data: { seo: 'vatCalculator', localized: true } },

    // `localized`: her dil için önekli sürüm (/de, /de/invoice/germany). Bunlar derlemede önceden render edilir
    // (app.routes.server.ts) ve arama motorlarına hreflang ile gösterilir; önieksiz adres x-default'tur.
    ...SUPPORTED_LANGUAGES.flatMap(({ code }) => [
        { path: code, component: CountrySelectComponent, pathMatch: 'full' as const, data: { seo: 'home', localized: true } },
        { path: `${code}/invoice/:country`, loadComponent: loadCountryGuide, data: { seo: 'countryGuide', localized: true } },
        { path: `${code}/tools/vat-calculator`, loadComponent: loadVatCalculator, data: { seo: 'vatCalculator', localized: true } },
    ]),

    // Yasal metinler: /kullanim-sartlari, /gizlilik-politikasi, /kvkk-aydinlatma-metni, /cerez-politikasi, /mesafeli-satis-sozlesmesi
    ...LEGAL_DOCS.map(doc => ({
        path: doc.path,
        loadComponent: () => import('./features/legal/legal-page.component').then(m => m.LegalPageComponent),
        data: { seo: doc.type, legalDoc: doc.type }
    })),

    // Private Routes (With Sidebar) - Protected by Auth Guard
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        data: { noindex: true },
        children: [
            { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent), data: { seo: 'dashboard' } },
            { path: 'ai-assistant', loadComponent: () => import('./features/ai-assistant/ai-assistant.component').then(m => m.AiAssistantComponent), data: { seo: 'aiAssistant' } },
            { path: 'invoices', loadComponent: () => import('./features/invoice-list/invoice-list.component').then(m => m.InvoiceListComponent), data: { seo: 'invoices' } },
            { path: 'expenses', loadComponent: () => import('./features/expenses/expenses.component').then(m => m.ExpensesComponent), data: { seo: 'expenses' } },
            { path: 'customers', loadComponent: () => import('./features/customers/customer-list.component').then(m => m.CustomerListComponent), data: { seo: 'customers' } },
            { path: 'reports', loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent), data: { seo: 'reports' } },
            { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent), data: { seo: 'settings' } },
        ]
    },

    // Tanımsız adresler
    { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent), data: { seo: 'notFound', noindex: true } }
];
