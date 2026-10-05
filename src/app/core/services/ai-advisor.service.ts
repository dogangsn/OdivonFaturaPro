import { Injectable, inject } from '@angular/core';
import { InvoiceService } from './invoice.service';
import { ExpenseService } from './expense.service';
import { CustomerService } from './customer.service';
import { firstValueFrom } from 'rxjs';
import { Invoice } from '../models/invoice.model';
import { Expense } from '../models/expense.model';
import { Customer } from '../models/customer.model';
import { LanguageService } from './language.service';

export interface FinancialHealthSummary {
    totalSalesVat: number;        // Hesaplanan KDV (391)
    totalExpenseVat: number;      // İndirilecek KDV (191)
    netVatPayable: number;        // Pozitif: Devlete Ödenecek KDV, Negatif: Sonraki Döneme Devreden KDV
    isVatRefund: boolean;         // Devreden KDV mi?
    overdueInvoicesCount: number; // Vadesi geçen fatura adedi
    overdueTotalAmount: number;   // Vadesi geçen toplam alacak tutarı
    upcomingInvoicesAmount: number;// Bu hafta vadesi dolacak alacak tutarı
    totalReceivables: number;     // Toplam açık alacak (ödenmemiş tüm faturalar)
    highRiskCustomersCount: number; // Yüksek riskli cari sayısı
    cashFlowForecast30Days: number;// 30 günlük tahmini net nakit akışı
    recommendations: { key: string; params?: Record<string, string | number> }[]; // AI Tavsiyeleri (çeviri anahtarı)
}

export interface AiChatMessage {
    id: string;
    sender: 'user' | 'assistant';
    text: string;
    textKey?: string;
    timestamp: Date;
    suggestedActions?: { label: string; action: string }[];
}

@Injectable({
    providedIn: 'root'
})
export class AiAdvisorService {
    private invoiceService = inject(InvoiceService);
    private expenseService = inject(ExpenseService);
    private customerService = inject(CustomerService);
    private lang = inject(LanguageService);

    private money(value: number): string {
        return value.toLocaleString(this.lang.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    /** Soru metnindeki anahtar kelimelerden niyeti çıkarır (tüm desteklenen diller). */
    private detectIntent(q: string): 'vat' | 'overdue' | 'risk' | 'cash' | 'general' {
        const has = (words: string[]) => words.some(w => q.includes(w));
        if (has(['kdv', 'vergi', 'vat', 'tax', 'mwst', 'steuer', 'tva', 'taxe', 'iva', 'impuesto', 'imposta', 'btw', 'belasting', 'ضريبة', 'الضريبة'])) return 'vat';
        if (has(['vade', 'gecik', 'alacak', 'overdue', 'receivable', 'due', 'überfällig', 'forderung', 'fällig', 'retard', 'créance', 'échéance', 'vencid', 'cobro', 'scadut', 'credit', 'vervallen', 'vordering', 'متأخر', 'مستحق'])) return 'overdue';
        if (has(['risk', 'müşteri', 'cari', 'customer', 'kunde', 'client', 'cliente', 'klant', 'مخاطر', 'عميل', 'العملاء'])) return 'risk';
        if (has(['nakit', 'öngörü', 'tahmin', 'durum', 'cash', 'forecast', 'liquid', 'trésorerie', 'prévision', 'caja', 'previsi', 'cassa', 'prognose', 'نقد', 'تدفق', 'توقع'])) return 'cash';
        return 'general';
    }

    /**
     * İşletmenin anlık KDV, vade, alacak ve cari risk sağlığını hesaplar
     */
    async calculateFinancialHealth(): Promise<FinancialHealthSummary> {
        const invoices = await firstValueFrom(this.invoiceService.getInvoices());
        const expenses = await firstValueFrom(this.expenseService.getExpenses());
        const customers = await firstValueFrom(this.customerService.getCustomers());

        const now = new Date();
        const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        // KDV Hesaplamaları
        const totalSalesVat = invoices
            .filter(inv => inv.status !== 'cancelled')
            .reduce((sum, inv) => sum + (inv.taxTotal || 0), 0);

        const totalExpenseVat = expenses
            .reduce((sum, exp) => sum + (exp.taxAmount || 0), 0);

        const netVatDiff = totalSalesVat - totalExpenseVat;
        const isVatRefund = netVatDiff < 0;
        const netVatPayable = Math.abs(netVatDiff);

        // Vade Analizi
        let overdueCount = 0;
        let overdueAmount = 0;
        let upcomingAmount = 0;
        let totalReceivables = 0;

        invoices.forEach(inv => {
            if (inv.status !== 'paid' && inv.status !== 'cancelled') {
                const total = inv.total || 0;
                totalReceivables += total;

                const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.date);
                if (dueDate < now) {
                    overdueCount++;
                    overdueAmount += total;
                } else if (dueDate <= next7Days) {
                    upcomingAmount += total;
                }
            }
        });

        // Cari Risk Analizi
        let highRiskCount = 0;
        customers.forEach(c => {
            const customerInvoices = invoices.filter(i => i.customerId === c.id || i.customerName === c.name);
            const customerOverdue = customerInvoices
                .filter(i => i.status !== 'paid' && i.status !== 'cancelled' && new Date(i.dueDate || i.date) < now)
                .reduce((s, i) => s + (i.total || 0), 0);

            if (customerOverdue > 10000 || (c.balance && c.balance > 25000)) {
                highRiskCount++;
            }
        });

        // 30 Günlük Tahmini Nakit Akışı: 30 gün içinde vadesi gelen alacaklar - cari ay ortalama gideri
        const upcoming30DaysReceivables = invoices
            .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled' && new Date(inv.dueDate || inv.date) <= next30Days)
            .reduce((s, i) => s + (i.total || 0), 0);

        const monthlyExpenseAvg = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        const cashFlowForecast30Days = upcoming30DaysReceivables - (monthlyExpenseAvg * 0.7);

        // Akıllı AI Tavsiyeleri
        const recommendations: FinancialHealthSummary['recommendations'] = [];

        if (isVatRefund) {
            recommendations.push({ key: 'ai.recVatRefund', params: { amount: this.money(netVatPayable) } });
        } else if (netVatPayable > 0) {
            recommendations.push({ key: 'ai.recVatPayable', params: { amount: this.money(netVatPayable) } });
        }

        if (overdueAmount > 0) {
            recommendations.push({ key: 'ai.recOverdue', params: { amount: this.money(overdueAmount), n: overdueCount } });
        } else {
            recommendations.push({ key: 'ai.recNoOverdue' });
        }

        if (cashFlowForecast30Days < 0) {
            recommendations.push({ key: 'ai.recCashNegative', params: { amount: this.money(Math.abs(cashFlowForecast30Days)) } });
        }

        return {
            totalSalesVat,
            totalExpenseVat,
            netVatPayable,
            isVatRefund,
            overdueInvoicesCount: overdueCount,
            overdueTotalAmount: overdueAmount,
            upcomingInvoicesAmount: upcomingAmount,
            totalReceivables,
            highRiskCustomersCount: highRiskCount,
            cashFlowForecast30Days,
            recommendations
        };
    }

    /**
     * Doğal dildeki kullanıcı sorusuna gerçek verilere dayalı akıllı cevap üretir
     */
    async answerFinancialQuery(query: string): Promise<string> {
        const q = query.toLocaleLowerCase().trim();
        const health = await this.calculateFinancialHealth();
        const t = (key: string, params?: Record<string, string | number>) => this.lang.t(key, params);

        switch (this.detectIntent(q)) {
            case 'vat':
                return t(health.isVatRefund ? 'ai.ansVatRefund' : 'ai.ansVatPayable', {
                    sales: this.money(health.totalSalesVat),
                    expense: this.money(health.totalExpenseVat),
                    amount: this.money(health.netVatPayable)
                });
            case 'overdue':
                if (health.overdueTotalAmount > 0) {
                    return t('ai.ansOverdue', {
                        n: health.overdueInvoicesCount,
                        overdue: this.money(health.overdueTotalAmount),
                        upcoming: this.money(health.upcomingInvoicesAmount),
                        receivables: this.money(health.totalReceivables)
                    });
                }
                return t('ai.ansNoOverdue', { receivables: this.money(health.totalReceivables) });
            case 'risk':
                return t('ai.ansRisk', { n: health.highRiskCustomersCount, overdue: this.money(health.overdueTotalAmount) });
            case 'cash': {
                const net = health.cashFlowForecast30Days;
                return t('ai.ansCash', {
                    upcoming: this.money(health.upcomingInvoicesAmount),
                    sign: net >= 0 ? '+' : '-',
                    net: this.money(Math.abs(net)),
                    verdict: t(net >= 0 ? 'ai.cashPositive' : 'ai.cashNegative')
                });
            }
            default:
                return t('ai.ansGeneral', {
                    vatLine: t(health.isVatRefund ? 'ai.genVatRefund' : 'ai.genVatPayable', { amount: this.money(health.netVatPayable) }),
                    overdue: this.money(health.overdueTotalAmount),
                    n: health.overdueInvoicesCount,
                    receivables: this.money(health.totalReceivables)
                });
        }
    }
}
