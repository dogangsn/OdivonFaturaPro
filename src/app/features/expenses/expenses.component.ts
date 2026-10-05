import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ExpenseService } from '../../core/services/expense.service';
import { AiScannerService, ScannedDocumentResult } from '../../core/services/ai-scanner.service';
import { LanguageService } from '../../core/services/language.service';
import { AlertService } from '../../core/services/alert.service';
import { Expense, ExpenseCategory, ExpenseFormData, PaymentMethod } from '../../core/models/expense.model';

@Component({
    selector: 'app-expenses',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './expenses.component.html'
})
export class ExpensesComponent implements OnInit, OnDestroy {
    private expenseService = inject(ExpenseService);
    private aiScannerService = inject(AiScannerService);
    private alertService = inject(AlertService);
    private fb = inject(FormBuilder);
    lang = inject(LanguageService);

    private sub: Subscription | null = null;
    expenses: Expense[] = [];
    filteredExpenses: Expense[] = [];

    // Filter states
    searchTerm = '';
    selectedCategory: string = 'all';

    // Modal states
    showExpenseModal = false;
    isEditing = false;
    editingExpenseId: string | null = null;
    isSaving = false;

    // AI Scanner Modal states
    showScannerModal = false;
    isScanning = false;
    scannedResult: ScannedDocumentResult | null = null;
    scannerPreviewUrl: string | null = null;
    scannerError: string | null = null;

    // Receipt viewer modal
    previewReceiptUrl: string | null = null;

    // Form
    expenseForm: FormGroup = this.fb.group({
        merchantName: ['', [Validators.required]],
        amount: [0, [Validators.required, Validators.min(0.01)]],
        taxAmount: [0, [Validators.min(0)]],
        taxRate: [20],
        isTaxInclusive: [true], // Varsayılan: KDV Dahil
        subtotal: [0],
        currency: ['TRY'],
        date: [new Date().toISOString().split('T')[0], [Validators.required]],
        category: ['office' as ExpenseCategory, [Validators.required]],
        paymentMethod: ['credit_card' as PaymentMethod, [Validators.required]],
        description: [''],
        receiptUrl: ['']
    });

    readonly categories: { value: ExpenseCategory; labelKey: string; icon: string; color: string }[] = [
        { value: 'food', labelKey: 'cat.food', icon: 'restaurant', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
        { value: 'transport', labelKey: 'cat.transport', icon: 'directions_car', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
        { value: 'office', labelKey: 'cat.office', icon: 'desk', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' },
        { value: 'utilities', labelKey: 'cat.utilities', icon: 'bolt', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300' },
        { value: 'software', labelKey: 'cat.software', icon: 'terminal', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300' },
        { value: 'marketing', labelKey: 'cat.marketing', icon: 'campaign', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' },
        { value: 'travel', labelKey: 'cat.travel', icon: 'flight', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' },
        { value: 'consulting', labelKey: 'cat.consulting', icon: 'handshake', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
        { value: 'salary', labelKey: 'cat.salary', icon: 'badge', color: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300' },
        { value: 'tax', labelKey: 'cat.tax', icon: 'account_balance', color: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' },
        { value: 'other', labelKey: 'cat.other', icon: 'more_horiz', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
    ];

    readonly paymentMethods: { value: PaymentMethod; labelKey: string }[] = [
        { value: 'credit_card', labelKey: 'pay.creditCard' },
        { value: 'cash', labelKey: 'pay.cash' },
        { value: 'bank_transfer', labelKey: 'pay.bankTransfer' },
        { value: 'company_card', labelKey: 'pay.companyCard' },
        { value: 'other', labelKey: 'pay.other' },
    ];

    ngOnInit(): void {
        this.sub = this.expenseService.getExpenses().subscribe(expenses => {
            this.expenses = expenses;
            this.applyFilters();
        });
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
    }

    applyFilters(): void {
        const query = this.searchTerm.trim().toLowerCase();
        this.filteredExpenses = this.expenses.filter(item => {
            const mName = item.merchantName || item.title || item.supplierName || '';
            const desc = item.description || item.notes || '';
            const matchesQuery = !query ||
                mName.toLowerCase().includes(query) ||
                desc.toLowerCase().includes(query);
            const matchesCategory = this.selectedCategory === 'all' || item.category === this.selectedCategory;
            return matchesQuery && matchesCategory;
        });
    }

    // Calculations
    get totalAmount(): number {
        return this.expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    }

    get thisMonthAmount(): number {
        const currentYearMonth = new Date().toISOString().substring(0, 7);
        return this.expenses
            .filter(e => {
                const dStr = typeof e.date === 'string' ? e.date : (e.date ? new Date(e.date).toISOString() : '');
                return dStr.startsWith(currentYearMonth);
            })
            .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    }

    get totalTaxAmount(): number {
        return this.expenses.reduce((acc, curr) => acc + (curr.taxAmount || 0), 0);
    }

    getCategoryMeta(cat: ExpenseCategory) {
        return this.categories.find(c => c.value === cat) || this.categories[this.categories.length - 1];
    }

    getPaymentMethodLabel(method: PaymentMethod): string {
        const pm = this.paymentMethods.find(m => m.value === method);
        if (!pm) return method;
        return this.lang.t(pm.labelKey);
    }

    // KDV Dahil / Hariç Hesaplama Metotları
    setTaxInclusive(isInclusive: boolean): void {
        this.expenseForm.patchValue({ isTaxInclusive: isInclusive });
        this.calculateTax();
    }

    onAmountChange(): void {
        this.calculateTax();
    }

    onTaxRateChange(): void {
        this.calculateTax();
    }

    calculateTax(): void {
        const inputAmount = Number(this.expenseForm.get('amount')?.value) || 0;
        const taxRate = Number(this.expenseForm.get('taxRate')?.value) || 0;
        const isInclusive = this.expenseForm.get('isTaxInclusive')?.value !== false;

        let subtotal = 0;
        let taxAmount = 0;

        if (taxRate === 0) {
            subtotal = inputAmount;
            taxAmount = 0;
        } else if (isInclusive) {
            // KDV Dahil: Girilen tutar Brüt Toplamdır
            subtotal = Math.round((inputAmount / (1 + taxRate / 100)) * 100) / 100;
            taxAmount = Math.round((inputAmount - subtotal) * 100) / 100;
        } else {
            // KDV Hariç: Girilen tutar Net Matrahtır
            subtotal = inputAmount;
            taxAmount = Math.round((inputAmount * (taxRate / 100)) * 100) / 100;
        }

        this.expenseForm.patchValue({
            subtotal: subtotal,
            taxAmount: taxAmount
        }, { emitEvent: false });
    }

    get isTaxInclusive(): boolean {
        return this.expenseForm.get('isTaxInclusive')?.value !== false;
    }

    get computedSubtotal(): number {
        const subtotal = Number(this.expenseForm.get('subtotal')?.value);
        if (subtotal > 0) return subtotal;
        const amount = Number(this.expenseForm.get('amount')?.value) || 0;
        const tax = Number(this.expenseForm.get('taxAmount')?.value) || 0;
        return this.isTaxInclusive ? Math.max(0, amount - tax) : amount;
    }

    get computedTaxAmount(): number {
        return Number(this.expenseForm.get('taxAmount')?.value) || 0;
    }

    get computedTotalAmount(): number {
        const amount = Number(this.expenseForm.get('amount')?.value) || 0;
        if (this.isTaxInclusive) {
            return amount;
        }
        return amount + this.computedTaxAmount;
    }

    // Modal Actions
    openAddModal(): void {
        this.isEditing = false;
        this.editingExpenseId = null;
        this.expenseForm.reset({
            merchantName: '',
            amount: 0,
            taxAmount: 0,
            taxRate: 20,
            isTaxInclusive: true,
            subtotal: 0,
            currency: 'TRY',
            date: new Date().toISOString().split('T')[0],
            category: 'office',
            paymentMethod: 'credit_card',
            description: '',
            receiptUrl: ''
        });
        this.showExpenseModal = true;
    }

    openEditModal(expense: Expense): void {
        this.isEditing = true;
        this.editingExpenseId = expense.id || null;
        const isInclusive = expense.isTaxInclusive !== false;
        this.expenseForm.patchValue({
            merchantName: expense.merchantName || expense.title || expense.supplierName || '',
            amount: expense.amount,
            taxAmount: expense.taxAmount || 0,
            taxRate: expense.taxRate || 20,
            isTaxInclusive: isInclusive,
            subtotal: expense.subtotal || (isInclusive ? (expense.amount - (expense.taxAmount || 0)) : expense.amount),
            currency: expense.currency || 'TRY',
            date: typeof expense.date === 'string' ? expense.date : new Date(expense.date).toISOString().split('T')[0],
            category: expense.category,
            paymentMethod: expense.paymentMethod,
            description: expense.description || expense.notes || '',
            receiptUrl: expense.receiptImage || ''
        });
        this.calculateTax();
        this.showExpenseModal = true;
    }

    closeExpenseModal(): void {
        this.showExpenseModal = false;
        this.isEditing = false;
        this.editingExpenseId = null;
    }

    async saveExpense(): Promise<void> {
        if (this.expenseForm.invalid) {
            this.expenseForm.markAllAsTouched();
            return;
        }

        this.isSaving = true;
        const isInclusive = this.expenseForm.get('isTaxInclusive')?.value !== false;
        const inputAmount = Number(this.expenseForm.get('amount')?.value) || 0;
        const taxAmount = Number(this.expenseForm.get('taxAmount')?.value) || 0;
        const subtotal = Number(this.expenseForm.get('subtotal')?.value) || (isInclusive ? (inputAmount - taxAmount) : inputAmount);
        const finalTotal = isInclusive ? inputAmount : (inputAmount + taxAmount);

        const formData: ExpenseFormData = {
            ...this.expenseForm.value,
            amount: finalTotal,
            subtotal: subtotal,
            taxAmount: taxAmount,
            isTaxInclusive: isInclusive
        };

        try {
            if (this.isEditing && this.editingExpenseId) {
                await this.expenseService.updateExpense(this.editingExpenseId, formData);
                this.alertService.toast(this.lang.t('expenses.updated'), 'success');
            } else {
                await this.expenseService.createExpense(formData);
                this.alertService.toast(this.lang.t('expenses.saved'), 'success');
            }
            this.closeExpenseModal();
        } catch (err) {
            console.error('Failed to save expense:', err);
            this.alertService.error(this.lang.t('common.error'), this.lang.t('expenses.saveFailed'));
        } finally {
            this.isSaving = false;
        }
    }

    async deleteExpense(id: string): Promise<void> {
        const confirmed = await this.alertService.confirm(
            this.lang.t('expenses.deleteTitle'),
            this.lang.t('expenses.deleteConfirm'),
            this.lang.t('common.yesDelete'),
            this.lang.t('alert.cancel')
        );

        if (confirmed) {
            try {
                await this.expenseService.deleteExpense(id);
                this.alertService.toast(this.lang.t('expenses.deleted'), 'info');
            } catch (err) {
                console.error('Failed to delete expense:', err);
                this.alertService.error(this.lang.t('common.error'), this.lang.t('expenses.deleteFailed'));
            }
        }
    }

    // Receipt Attachment Handling inside Expense Form
    async onReceiptFileSelected(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            try {
                const base64 = await this.aiScannerService.compressImage(file);
                this.expenseForm.patchValue({ receiptUrl: base64 });
            } catch (e) {
                console.error('Failed to convert receipt to base64', e);
            }
        }
    }

    removeFormReceipt(): void {
        this.expenseForm.patchValue({ receiptUrl: '' });
    }

    // AI Scanner Modal Actions
    openScannerModal(): void {
        this.scannedResult = null;
        this.scannerPreviewUrl = null;
        this.scannerError = null;
        this.isScanning = false;
        this.showScannerModal = true;
    }

    closeScannerModal(): void {
        this.showScannerModal = false;
        this.scannedResult = null;
        this.scannerPreviewUrl = null;
        this.scannerError = null;
    }

    async onScannerFileSelected(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            await this.processScannerFile(file);
        }
    }

    onScannerDrop(event: DragEvent): void {
        event.preventDefault();
        if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            const file = event.dataTransfer.files[0];
            this.processScannerFile(file);
        }
    }

    private async processScannerFile(file: File): Promise<void> {
        try {
            this.isScanning = true;
            this.scannerError = null;
            const base64 = await this.aiScannerService.compressImage(file);
            this.scannerPreviewUrl = base64;

            const result = await this.aiScannerService.scanReceiptOrInvoice(file);
            this.scannedResult = result;
        } catch (err: any) {
            console.error('AI Scanning failed:', err);
            this.scannerError = err.message || this.lang.t('scanner.error');
        } finally {
            this.isScanning = false;
        }
    }

    applyScannedResultToExpense(): void {
        if (!this.scannedResult) return;

        // Auto map category if predicted or default to office/food
        let matchedCat: ExpenseCategory = 'office';
        if (this.scannedResult.category) {
            const found = this.categories.find(c => c.value === this.scannedResult?.category);
            if (found) matchedCat = found.value;
        }

        this.openAddModal();
        this.expenseForm.patchValue({
            merchantName: this.scannedResult.merchantName || '',
            amount: this.scannedResult.totalAmount || 0,
            taxAmount: this.scannedResult.taxAmount || 0,
            taxRate: this.scannedResult.taxRate || 20,
            currency: this.scannedResult.currency || 'TRY',
            date: this.scannedResult.date || new Date().toISOString().split('T')[0],
            category: matchedCat,
            description: this.scannedResult.items && this.scannedResult.items.length > 0 
                ? this.scannedResult.items.map(i => `${i.description} (${i.totalPrice} TL)`).join(', ')
                : (this.scannedResult.rawText?.substring(0, 100) || ''),
            receiptUrl: this.scannerPreviewUrl || ''
        });

        this.closeScannerModal();
    }

    // Receipt Full Image Preview
    openReceiptPreview(url: string): void {
        this.previewReceiptUrl = url;
    }

    closeReceiptPreview(): void {
        this.previewReceiptUrl = null;
    }

    // Export CSV
    exportToCsv(): void {
        if (this.filteredExpenses.length === 0) {
            this.alertService.warning(this.lang.t('common.noRecords'), this.lang.t('expenses.noExport'));
            return;
        }

        const headers = [this.lang.t('table.date'), this.lang.t('csv.merchantDesc'), this.lang.t('csv.category'), this.lang.t('table.amount'), this.lang.t('doc.vat'), this.lang.t('expenses.currency'), this.lang.t('csv.paymentMethod')];
        const rows = this.filteredExpenses.map(e => [
            `"${typeof e.date === 'string' ? e.date : (e.date ? new Date(e.date).toLocaleDateString(this.lang.locale) : '')}"`,
            `"${(e.merchantName || e.title || e.supplierName || '').replace(/"/g, '""')}"`,
            `"${this.lang.t(this.getCategoryMeta(e.category).labelKey)}"`,
            e.amount.toString(),
            (e.taxAmount || 0).toString(),
            `"${e.currency || 'TRY'}"`,
            `"${this.getPaymentMethodLabel(e.paymentMethod)}"`
        ]);

        const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${this.lang.t('csv.expensesFile')}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
