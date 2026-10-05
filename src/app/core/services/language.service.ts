import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Language = 'tr' | 'en';

const translations: Record<Language, Record<string, string>> = {
    tr: {
        // Auth
        'auth.login': 'Giriş Yap',
        'auth.logout': 'Çıkış Yap',
        'auth.loginWithGoogle': 'Google ile Giriş Yap',
        'auth.orWithEmail': 'veya e-posta ile',
        'auth.password': 'Şifre',
        'auth.rememberMe': 'Beni Hatırla',
        'auth.forgotPassword': 'Şifremi Unuttum',
        'auth.welcome': 'Hoş Geldiniz',
        'auth.enterCredentials': 'Hesabınıza erişmek için bilgilerinizi girin.',
        'auth.loggingIn': 'Giriş yapılıyor...',

        // Sidebar
        'sidebar.dashboard': 'Panel',
        'sidebar.aiAssistant': '🤖 FaturaPro AI',
        'sidebar.invoices': 'Faturalar',
        'sidebar.createInvoice': 'Fatura Oluştur',
        'sidebar.customers': 'Cari Hesaplar',
        'sidebar.reports': 'Raporlar',
        'sidebar.pricing': 'Paketler & Planlar',
        'sidebar.settings': 'Ayarlar',

        // Dashboard
        'dashboard.welcome': 'Hoş Geldiniz',
        'dashboard.summary': 'İşte bugünkü özet bilgileriniz',
        'dashboard.totalRevenue': 'Toplam Gelir',
        'dashboard.totalInvoices': 'Toplam Fatura',
        'dashboard.pending': 'Bekleyen',
        'dashboard.paid': 'Ödenen',
        'dashboard.newInvoice': 'Yeni Fatura',

        // Countries
        'countries.title': 'İşlem Yapılacak Ülkeyi Seçiniz',
        'countries.label': 'İşlem Yapılacak Ülke',
        'countries.subtitle': 'Oluşturulacak fatura, seçtiğiniz ülkenin vergi ve format kurallarına uygun olacaktır.',
        'countries.turkey': 'Türkiye',
        'countries.dubai': 'Dubai (BAE)',
        'countries.germany': 'Almanya',
        'countries.france': 'Fransa',
        'countries.uk': 'Birleşik Krallık',
        'countries.spain': 'İspanya',
        'countries.italy': 'İtalya',
        'countries.netherlands': 'Hollanda',
        'countries.canada': 'Kanada',
        'countries.usa': 'ABD',
        'countries.australia': 'Avustralya',

        // Common
        'common.save': 'Kaydet',
        'common.cancel': 'İptal',
        'common.delete': 'Sil',
        'common.edit': 'Düzenle',
        'common.add': 'Ekle',
        'common.search': 'Ara',
        'common.email': 'E-posta',
        'common.loading': 'Yükleniyor...',
        'common.exportCsv': 'CSV İndir',
        'common.actions': 'İşlemler',

        // Invoices
        'invoices.title': 'Faturalar',
        'invoices.new': 'Yeni Fatura',
        'invoices.preview': 'Önizle',
        'invoices.downloadPdf': 'PDF İndir',
        'invoices.print': 'Yazdır',

        // Customers
        'customers.title': 'Müşteriler',
        'customers.new': 'Yeni Müşteri',

        // Reports
        'reports.title': 'Raporlar & Analizler',
        'reports.subtitle': 'Finansal performans, giderler, KDV ve müşteri analizleriniz',
        'reports.tabSales': 'Satış & Gelir',
        'reports.tabExpenses': 'Gider & Harcama',
        'reports.tabTax': 'Vergi & KDV Özeti',
        'reports.tabCustomers': 'Müşteri Analizi',
        'reports.tabProfitLoss': 'Kar / Zarar Tablosu',
        'reports.criteria': 'Rapor Kriterleri',
        'reports.startDate': 'Başlangıç Tarihi',
        'reports.endDate': 'Bitiş Tarihi',
        'reports.statusFilter': 'Durum Filtresi',
        'reports.updateReport': 'Raporu Güncelle',
        'reports.filterAll': 'Tüm Kayıtlar',
        'reports.filterPaid': 'Sadece Ödenenler',
        'reports.filterPending': 'Sadece Bekleyenler',
        'reports.filterOverdue': 'Gecikmiş Kayıtlar',
        'reports.totalRevenue': 'Toplam Tahsil Edilen Gelir',
        'reports.totalInvoices': 'Toplam Fatura Sayısı',
        'reports.totalTax': 'Hesaplanan Toplam Vergi',
        'reports.totalExpenses': 'Toplam İşletme Gideri',
        'reports.netProfit': 'Net Kar / Zarar',
        'reports.collectedVat': 'Fatura KDV (Tahsil Edilen)',
        'reports.paidVat': 'Gider KDV (İndirilecek KDV)',
        'reports.netVat': 'Ödenecek Net KDV',
        'reports.salesChartTitle': 'Aylık Ödenen Satış Grafiği (₺)',
        'reports.expenseChartTitle': 'Aylık Gider Dağılım Grafiği (₺)',
        'reports.profitLossChartTitle': 'Gelir vs Gider Karşılaştırması (₺)',
        'reports.recentInvoices': 'Raporlanan Fatura Listesi',
        'reports.recentExpenses': 'Raporlanan Gider Listesi',
        'reports.topCustomers': 'Müşteri Bazlı Satış Performansı',
        'reports.invoiceNo': 'Fatura No',
        'reports.customer': 'Müşteri / Firma',
        'reports.date': 'Tarih',
        'reports.status': 'Durum',
        'reports.tax': 'Vergi',
        'reports.total': 'Toplam Tutar',
        'reports.merchant': 'Tedarikçi / Firma',
        'reports.category': 'Kategori',
        'reports.print': 'Yazdır',
        'reports.noDataFound': 'Seçilen kriterlerde kayıt bulunamadı.',

        // Settings
        'settings.title': 'Firma & Hesap Ayarları',
        'settings.subtitle': 'Fatura şablonlarınızda görünecek firma ve banka bilgilerinizi yönetin.',
        'settings.companyName': 'Firma / Şirket Adı',
        'settings.companyAddress': 'Firma Adresi',
        'settings.taxOffice': 'Vergi Dairesi',
        'settings.taxId': 'Vergi Numarası / TCKN',
        'settings.phone': 'Telefon Numarası',
        'settings.bankName': 'Banka Adı',
        'settings.iban': 'IBAN Numarası',
        'settings.logoUrl': 'Logo URL Adresi',
        'settings.saveSuccess': 'Ayarlar başarıyla kaydedildi!',

        // Expenses
        'sidebar.expenses': 'Giderler & Harcamalar',
        'expenses.title': 'Giderler & Harcama Takibi',
        'expenses.subtitle': 'İşletme giderlerinizi, fiş ve faturalarınızı yapay zeka desteğiyle kolayca yönetin.',
        'expenses.new': 'Yeni Gider Ekle',
        'expenses.total': 'Toplam Gider',
        'expenses.thisMonth': 'Bu Ayki Harcamalar',
        'expenses.taxAmount': 'Toplam KDV / Vergi',
        'expenses.allCategories': 'Tüm Kategoriler',
        'expenses.merchant': 'Firma / Tedarikçi',
        'expenses.category': 'Kategori',
        'expenses.date': 'Tarih',
        'expenses.amount': 'Tutar',
        'expenses.tax': 'KDV Tutarı',
        'expenses.paymentMethod': 'Ödeme Yöntemi',
        'expenses.receipt': 'Fiş/Fatura Belgesi',
        'expenses.noExpenses': 'Henüz kaydedilmiş bir gider bulunmuyor.',
        'expenses.scanWithAi': 'AI ile Fiş Tara',
        'expenses.saveSuccess': 'Gider başarıyla kaydedildi.',
        'expenses.deleteConfirm': 'Bu gider kaydını silmek istediğinize emin misiniz?',

        // AI Scanner
        'scanner.modalTitle': 'AI Fiş & Fatura Tarayıcı',
        'scanner.modalDesc': 'Fiş veya fatura görselini yükleyin, yapay zeka tutar, tarih, KDV ve kalemleri otomatik çıkarsın.',
        'scanner.dropzone': 'Görseli buraya sürükleyin veya dosya seçin',
        'scanner.dropzoneHint': 'PNG, JPG veya WEBP (Maks. 10MB)',
        'scanner.scanning': 'Yapay Zeka Analiz Ediyor...',
        'scanner.scanningHint': 'Görsel taranıyor, veriler ayrıştırılıyor...',
        'scanner.applyData': 'Forma Aktar',
        'scanner.scanAgain': 'Yeniden Tara',
        'scanner.confidence': 'Güven Oranı',
        'scanner.foundMerchant': 'Tespit Edilen Firma',
        'scanner.foundDate': 'Fiş/Fatura Tarihi',
        'scanner.foundTotal': 'Toplam Tutar',
        'scanner.foundTax': 'KDV Tutarı',
    },
    en: {
        // Auth
        'auth.login': 'Login',
        'auth.logout': 'Logout',
        'auth.loginWithGoogle': 'Login with Google',
        'auth.orWithEmail': 'or with email',
        'auth.password': 'Password',
        'auth.rememberMe': 'Remember Me',
        'auth.forgotPassword': 'Forgot Password',
        'auth.welcome': 'Welcome',
        'auth.enterCredentials': 'Enter your credentials to access your account.',
        'auth.loggingIn': 'Logging in...',

        // Sidebar
        'sidebar.dashboard': 'Dashboard',
        'sidebar.aiAssistant': '🤖 FaturaPro AI',
        'sidebar.invoices': 'Invoices',
        'sidebar.createInvoice': 'Create Invoice',
        'sidebar.customers': 'Current Accounts',
        'sidebar.reports': 'Reports',
        'sidebar.pricing': 'Plans & Pricing',
        'sidebar.settings': 'Settings',

        // Dashboard
        'dashboard.welcome': 'Welcome',
        'dashboard.summary': 'Here is your summary for today',
        'dashboard.totalRevenue': 'Total Revenue',
        'dashboard.totalInvoices': 'Total Invoices',
        'dashboard.pending': 'Pending',
        'dashboard.paid': 'Paid',
        'dashboard.newInvoice': 'New Invoice',

        // Countries
        'countries.title': 'Select Country for Transaction',
        'countries.label': 'Transaction Country',
        'countries.subtitle': 'The invoice will comply with the tax and format rules of the selected country.',
        'countries.turkey': 'Turkey',
        'countries.dubai': 'Dubai (UAE)',
        'countries.germany': 'Germany',
        'countries.france': 'France',
        'countries.uk': 'United Kingdom',
        'countries.spain': 'Spain',
        'countries.italy': 'Italy',
        'countries.netherlands': 'Netherlands',
        'countries.canada': 'Canada',
        'countries.usa': 'USA',
        'countries.australia': 'Australia',

        // Common
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.add': 'Add',
        'common.search': 'Search',
        'common.email': 'Email',
        'common.loading': 'Loading...',
        'common.exportCsv': 'Export CSV',
        'common.actions': 'Actions',

        // Invoices
        'invoices.title': 'Invoices',
        'invoices.new': 'New Invoice',
        'invoices.preview': 'Preview',
        'invoices.downloadPdf': 'Download PDF',
        'invoices.print': 'Print',

        // Customers
        'customers.title': 'Customers',
        'customers.new': 'New Customer',

        // Reports
        'reports.title': 'Reports & Analytics',
        'reports.subtitle': 'Financial performance, expenses, VAT tax and customer analytics',
        'reports.tabSales': 'Sales & Revenue',
        'reports.tabExpenses': 'Expenses & Costs',
        'reports.tabTax': 'VAT & Tax Summary',
        'reports.tabCustomers': 'Customer Performance',
        'reports.tabProfitLoss': 'Profit & Loss Statement',
        'reports.criteria': 'Report Criteria',
        'reports.startDate': 'Start Date',
        'reports.endDate': 'End Date',
        'reports.statusFilter': 'Status Filter',
        'reports.updateReport': 'Update Report',
        'reports.filterAll': 'All Records',
        'reports.filterPaid': 'Paid Only',
        'reports.filterPending': 'Pending Only',
        'reports.filterOverdue': 'Overdue Records',
        'reports.totalRevenue': 'Total Revenue Collected',
        'reports.totalInvoices': 'Total Invoices Count',
        'reports.totalTax': 'Total Calculated Tax',
        'reports.totalExpenses': 'Total Business Expenses',
        'reports.netProfit': 'Net Profit / Loss',
        'reports.collectedVat': 'Output VAT (Invoices)',
        'reports.paidVat': 'Input VAT (Expenses)',
        'reports.netVat': 'Net Payable VAT',
        'reports.salesChartTitle': 'Monthly Paid Sales Chart',
        'reports.expenseChartTitle': 'Monthly Expense Breakdown Chart',
        'reports.profitLossChartTitle': 'Revenue vs Expense Comparison',
        'reports.recentInvoices': 'Reported Invoices List',
        'reports.recentExpenses': 'Reported Expenses List',
        'reports.topCustomers': 'Sales Performance by Customer',
        'reports.invoiceNo': 'Invoice No',
        'reports.customer': 'Customer / Company',
        'reports.date': 'Date',
        'reports.status': 'Status',
        'reports.tax': 'Tax',
        'reports.total': 'Total Amount',
        'reports.merchant': 'Vendor / Merchant',
        'reports.category': 'Category',
        'reports.print': 'Print',
        'reports.noDataFound': 'No records found for the selected criteria.',

        // Settings
        'settings.title': 'Company & Account Settings',
        'settings.subtitle': 'Manage company and bank details appearing on your invoice templates.',
        'settings.companyName': 'Company Name',
        'settings.companyAddress': 'Company Address',
        'settings.taxOffice': 'Tax Office',
        'settings.taxId': 'Tax ID / VAT No',
        'settings.phone': 'Phone Number',
        'settings.bankName': 'Bank Name',
        'settings.iban': 'IBAN Number',
        'settings.logoUrl': 'Logo URL',
        'settings.saveSuccess': 'Settings updated successfully!',

        // Expenses
        'sidebar.expenses': 'Expenses',
        'expenses.title': 'Expense Tracking',
        'expenses.subtitle': 'Manage business expenses, receipts and invoices easily with AI assistance.',
        'expenses.new': 'Add Expense',
        'expenses.total': 'Total Expenses',
        'expenses.thisMonth': 'This Month',
        'expenses.taxAmount': 'Total VAT / Tax',
        'expenses.allCategories': 'All Categories',
        'expenses.merchant': 'Merchant / Vendor',
        'expenses.category': 'Category',
        'expenses.date': 'Date',
        'expenses.amount': 'Amount',
        'expenses.tax': 'Tax Amount',
        'expenses.paymentMethod': 'Payment Method',
        'expenses.receipt': 'Receipt Document',
        'expenses.noExpenses': 'No expenses recorded yet.',
        'expenses.scanWithAi': 'Scan Receipt with AI',
        'expenses.saveSuccess': 'Expense saved successfully.',
        'expenses.deleteConfirm': 'Are you sure you want to delete this expense?',

        // AI Scanner
        'scanner.modalTitle': 'AI Receipt & Invoice Scanner',
        'scanner.modalDesc': 'Upload receipt or invoice image; AI will extract amount, date, tax and line items automatically.',
        'scanner.dropzone': 'Drag & drop image here, or browse',
        'scanner.dropzoneHint': 'PNG, JPG or WEBP (Max 10MB)',
        'scanner.scanning': 'AI is analyzing...',
        'scanner.scanningHint': 'Scanning image and extracting financial data...',
        'scanner.applyData': 'Apply to Form',
        'scanner.scanAgain': 'Scan Again',
        'scanner.confidence': 'Confidence',
        'scanner.foundMerchant': 'Detected Merchant',
        'scanner.foundDate': 'Receipt Date',
        'scanner.foundTotal': 'Total Amount',
        'scanner.foundTax': 'Tax Amount',
    }
};

@Injectable({
    providedIn: 'root'
})
export class LanguageService {
    private platformId = inject(PLATFORM_ID);
    
    currentLang = signal<Language>('tr');

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            const saved = localStorage.getItem('lang') as Language;
            if (saved && (saved === 'tr' || saved === 'en')) {
                this.currentLang.set(saved);
            }
        }
    }

    setLanguage(lang: Language) {
        this.currentLang.set(lang);
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('lang', lang);
        }
    }

    t(key: string): string {
        return translations[this.currentLang()][key] || key;
    }

    get lang(): Language {
        return this.currentLang();
    }
}

