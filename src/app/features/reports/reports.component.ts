import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../core/services/invoice.service';
import { ExpenseService } from '../../core/services/expense.service';
import { LanguageService } from '../../core/services/language.service';
import { Invoice } from '../../core/models/invoice.model';
import { Expense } from '../../core/models/expense.model';
import { combineLatest } from 'rxjs';

export type ReportTab = 'sales' | 'expenses' | 'tax' | 'customers' | 'profit_loss';

export interface CustomerReportItem {
    customerName: string;
    invoiceCount: number;
    totalAmount: number;
    percentage: number;
}

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './reports.component.html',
    styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
    private invoiceService = inject(InvoiceService);
    private expenseService = inject(ExpenseService);
    private platformId = inject(PLATFORM_ID);
    lang = inject(LanguageService);

    // Active Tab
    activeTab: ReportTab = 'sales';

    // Raw Data
    invoices: Invoice[] = [];
    expenses: Expense[] = [];

    // Filtered Data
    filteredInvoices: Invoice[] = [];
    filteredExpenses: Expense[] = [];
    customerBreakdown: CustomerReportItem[] = [];

    isLoading = false;

    // Date & Type Filters
    startDate: string = '';
    endDate: string = '';
    reportType: string = 'all';

    // Metrics
    totalRevenue: number = 0;
    totalInvoicesCount: number = 0;
    totalTax: number = 0;
    totalExpenses: number = 0;
    netProfit: number = 0;

    // VAT Metrics
    collectedVat: number = 0;
    paidVat: number = 0;
    netVat: number = 0;

    // Chart Data
    monthlySales: { month: number; value: number; amount: number }[] = [];
    monthlyExpensesData: { month: number; value: number; amount: number }[] = [];
    monthlyProfitLoss: { month: number; revenue: number; expense: number; profit: number; revVal: number; expVal: number }[] = [];

    ngOnInit(): void {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        this.startDate = startOfYear.toISOString().split('T')[0];
        this.endDate = today.toISOString().split('T')[0];

        if (isPlatformBrowser(this.platformId)) {
            this.loadReportsData();
        }
    }

    setTab(tab: ReportTab): void {
        this.activeTab = tab;
        this.applyFilter();
    }

    private loadReportsData(): void {
        this.isLoading = true;
        combineLatest([
            this.invoiceService.getInvoices(),
            this.expenseService.getExpenses()
        ]).subscribe({
            next: ([invData, expData]) => {
                this.invoices = invData || [];
                this.expenses = expData || [];
                this.applyFilter();
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Failed to load report data:', err);
                this.isLoading = false;
            }
        });
    }

    applyFilter(): void {
        let invs = [...this.invoices];
        let exps = [...this.expenses];

        const start = this.startDate ? new Date(this.startDate).getTime() : 0;
        const end = this.endDate ? new Date(this.endDate).getTime() + 86400000 : Infinity;

        // Filter Invoices by Date
        invs = invs.filter(inv => {
            if (!inv.date) return true;
            const t = new Date(inv.date).getTime();
            return t >= start && t <= end;
        });

        // Filter Expenses by Date
        exps = exps.filter(exp => {
            if (!exp.date) return true;
            const t = new Date(exp.date).getTime();
            return t >= start && t <= end;
        });

        // Filter Invoices by Status
        if (this.reportType !== 'all') {
            invs = invs.filter(inv => inv.status === this.reportType);
        }

        this.filteredInvoices = invs;
        this.filteredExpenses = exps;

        this.calculateMetrics();
    }

    private calculateMetrics(): void {
        let revenue = 0;
        let invoiceTax = 0;
        let expenseTotal = 0;
        let expenseTax = 0;

        const currentYear = new Date().getFullYear();
        const monthlyRev = new Array(12).fill(0);
        const monthlyExp = new Array(12).fill(0);
        const customerMap = new Map<string, { count: number; total: number }>();

        // Calculate Invoice Metrics
        this.filteredInvoices.forEach(inv => {
            const amt = inv.total || 0;
            const taxAmt = inv.taxTotal || 0;

            if (inv.status === 'paid') {
                revenue += amt;
            }
            invoiceTax += taxAmt;

            // Customer aggregation
            const cName = inv.customerName?.trim() || this.lang.t('reports.otherCustomer');
            const curr = customerMap.get(cName) || { count: 0, total: 0 };
            customerMap.set(cName, {
                count: curr.count + 1,
                total: curr.total + amt
            });

            // Monthly Sales
            if (inv.date) {
                const d = new Date(inv.date);
                if (d.getFullYear() === currentYear && inv.status === 'paid') {
                    monthlyRev[d.getMonth()] += amt;
                }
            }
        });

        // Calculate Expense Metrics
        this.filteredExpenses.forEach(exp => {
            const amt = Number(exp.amount) || 0;
            const taxAmt = Number(exp.taxAmount) || 0;

            expenseTotal += amt;
            expenseTax += taxAmt;

            if (exp.date) {
                const d = new Date(exp.date);
                if (d.getFullYear() === currentYear) {
                    monthlyExp[d.getMonth()] += amt;
                }
            }
        });

        this.totalRevenue = revenue;
        this.totalInvoicesCount = this.filteredInvoices.length;
        this.totalTax = invoiceTax;
        this.totalExpenses = expenseTotal;
        this.netProfit = revenue - expenseTotal;

        this.collectedVat = invoiceTax;
        this.paidVat = expenseTax;
        this.netVat = Math.max(0, invoiceTax - expenseTax);

        // Chart Height Calculations
        const maxRev = Math.max(...monthlyRev, 1);
        const maxExp = Math.max(...monthlyExp, 1);
        const maxCombined = Math.max(...monthlyRev, ...monthlyExp, 1);

        this.monthlySales = monthlyRev.map((amt, idx) => ({
            month: idx,
            amount: amt,
            value: Math.round((amt / maxRev) * 100)
        }));

        this.monthlyExpensesData = monthlyExp.map((amt, idx) => ({
            month: idx,
            amount: amt,
            value: Math.round((amt / maxExp) * 100)
        }));

        this.monthlyProfitLoss = monthlyRev.map((rev, idx) => {
            const exp = monthlyExp[idx];
            return {
                month: idx,
                revenue: rev,
                expense: exp,
                profit: rev - exp,
                revVal: Math.round((rev / maxCombined) * 100),
                expVal: Math.round((exp / maxCombined) * 100)
            };
        });

        // Customer Breakdown List
        const totalSalesSum = Array.from(customerMap.values()).reduce((sum, item) => sum + item.total, 0) || 1;
        this.customerBreakdown = Array.from(customerMap.entries())
            .map(([customerName, data]) => ({
                customerName,
                invoiceCount: data.count,
                totalAmount: data.total,
                percentage: Math.round((data.total / totalSalesSum) * 100)
            }))
            .sort((a, b) => b.totalAmount - a.totalAmount);
    }

    exportReportToCsv(): void {
        let headers: string[] = [];
        let rows: (string | number)[][] = [];
        let filename = `${this.lang.t('reports.csvFile')}_${this.activeTab}_${new Date().toISOString().split('T')[0]}.csv`;

        if (this.activeTab === 'expenses') {
            headers = ['csv.supplier', 'csv.category', 'csv.date', 'csv.vatAmount', 'csv.totalAmount', 'csv.paymentMethod'].map(k => this.lang.t(k));
            rows = this.filteredExpenses.map(exp => [
                `"${exp.merchantName || exp.title}"`,
                `"${this.categoryLabel(exp.category)}"`,
                `"${exp.date}"`,
                `"${exp.taxAmount || 0}"`,
                `"${exp.amount || 0}"`,
                `"${this.paymentLabel(exp.paymentMethod)}"`
            ]);
        } else if (this.activeTab === 'customers') {
            headers = ['csv.customerName', 'csv.invoiceCount', 'csv.totalSales', 'csv.salesShare'].map(k => this.lang.t(k));
            rows = this.customerBreakdown.map(c => [
                `"${c.customerName}"`,
                `"${c.invoiceCount}"`,
                `"${c.totalAmount}"`,
                `"%${c.percentage}"`
            ]);
        } else {
            headers = ['csv.invoiceNo', 'csv.customer', 'csv.date', 'csv.dueDate', 'csv.taxTotal', 'csv.grandTotal', 'csv.status'].map(k => this.lang.t(k));
            rows = this.filteredInvoices.map(inv => [
                `"${inv.invoiceNo}"`,
                `"${inv.customerName}"`,
                `"${inv.date}"`,
                `"${inv.dueDate}"`,
                `"${inv.taxTotal || 0}"`,
                `"${inv.total || 0}"`,
                `"${this.getStatusLabel(inv.status)}"`
            ]);
        }

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.click();
    }

    printReport(): void {
        if (isPlatformBrowser(this.platformId)) {
            window.print();
        }
    }

    getStatusClass(status: string): string {
        const classes: Record<string, string> = {
            'paid': 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400',
            'pending': 'bg-orange-100 text-orange-700 dark:bg-amber-950/60 dark:text-amber-400',
            'overdue': 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400',
            'draft': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
            'cancelled': 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
        };
        return classes[status] || 'bg-slate-100 text-slate-700';
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            'paid': this.lang.t('reports.filterPaid'),
            'pending': this.lang.t('reports.filterPending'),
            'overdue': this.lang.t('reports.filterOverdue'),
            'draft': this.lang.t('status.draft'),
            'cancelled': this.lang.t('status.cancelled')
        };
        return labels[status] || status;
    }

    categoryLabel(category: string | undefined): string {
        if (!category) return '';
        const key = 'cat.' + category;
        const label = this.lang.t(key);
        return label === key ? category : label;
    }

    paymentLabel(method: string | undefined): string {
        const keys: Record<string, string> = {
            'credit_card': 'pay.creditCard',
            'cash': 'pay.cash',
            'bank_transfer': 'pay.bankTransfer',
            'company_card': 'pay.companyCard',
            'other': 'pay.other'
        };
        return method && keys[method] ? this.lang.t(keys[method]) : (method || '');
    }
}
