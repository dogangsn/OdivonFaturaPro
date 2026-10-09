import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { InvoiceListComponent } from './features/invoice-list/invoice-list.component';
import { CreateInvoiceComponent } from './features/create-invoice/create-invoice.component';
import { CountrySelectComponent } from './features/country-select/country-select.component';
import { LoginComponent } from './features/login/login.component';
import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { LEGAL_DOCS } from './core/constants/legal.constant';

// `seo`: seo.<anahtar>.title/description çevirileri (SeoService). Panel sayfaları girişe kapalı olduğundan dizine eklenmez.
export const routes: Routes = [
    // Public Routes (No Sidebar)
    { path: '', component: CountrySelectComponent, pathMatch: 'full', data: { seo: 'home' } },
    { path: 'login', component: LoginComponent, data: { seo: 'login' } },
    { path: 'create-invoice', component: CreateInvoiceComponent, data: { seo: 'createInvoice' } },
    { path: 'pricing', loadComponent: () => import('./features/pricing/pricing.component').then(m => m.PricingComponent), data: { seo: 'pricing' } },

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
            { path: 'dashboard', component: DashboardComponent, data: { seo: 'dashboard' } },
            { path: 'ai-assistant', loadComponent: () => import('./features/ai-assistant/ai-assistant.component').then(m => m.AiAssistantComponent), data: { seo: 'aiAssistant' } },
            { path: 'invoices', component: InvoiceListComponent, data: { seo: 'invoices' } },
            { path: 'expenses', loadComponent: () => import('./features/expenses/expenses.component').then(m => m.ExpensesComponent), data: { seo: 'expenses' } },
            { path: 'customers', loadComponent: () => import('./features/customers/customer-list.component').then(m => m.CustomerListComponent), data: { seo: 'customers' } },
            { path: 'reports', loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent), data: { seo: 'reports' } },
            { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent), data: { seo: 'settings' } },
        ]
    },

    // Tanımsız adresler
    { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent), data: { seo: 'notFound', noindex: true } }
];
