import { Component, OnInit, inject, PLATFORM_ID, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InvoiceService } from '../../core/services/invoice.service';
import { CustomerService } from '../../core/services/customer.service';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { Invoice, InvoiceFormData, InvoiceItem } from '../../core/models/invoice.model';
import { Customer } from '../../core/models/customer.model';
import { UserProfile } from '../../core/models/user.model';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { UserService } from '../../core/services/user.service';
import { AlertService } from '../../core/services/alert.service';
import { Router } from '@angular/router';
import { COUNTRIES_CONFIG, COUNTRY_MAP } from '../../core/constants/countries.constant';

@Component({
    selector: 'app-invoice-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './invoice-list.component.html',
    styleUrl: './invoice-list.component.css'
})
export class InvoiceListComponent implements OnInit {
    private invoiceService = inject(InvoiceService);
    private customerService = inject(CustomerService);
    private authService = inject(AuthService);
    private userService = inject(UserService);
    private alertService = inject(AlertService);
    private router = inject(Router);
    private platformId = inject(PLATFORM_ID);
    lang = inject(LanguageService);

    @ViewChild('invoicePreviewCard') invoicePreviewCardRef!: ElementRef<HTMLElement>;

    invoices: Invoice[] = [];
    filteredInvoices: Invoice[] = [];
    customers: Customer[] = [];
    selectedIds: Set<string> = new Set();
    searchTerm = '';
    statusFilter = 'all';
    typeFilter: 'all' | 'commercial' | 'proforma' = 'all';
    vadeFilter: 'all' | 'overdue' | 'this_week' = 'all';
    approvalFilter: 'all' | 'pending_approval' | 'approved' | 'rejected' = 'all';
    selectedTemplateId: 'classic' | 'modern' | 'tech' | 'formal' = 'classic';
    isLoading = false;

    // Pagination
    currentPage = 1;
    pageSize = 8;

    // Modal state
    showModal = false;
    isEditing = false;
    editingInvoiceId: string | null = null;
    isSaving = false;

    // Preview modal state
    showPreviewModal = false;
    previewInvoice: Invoice | null = null;
    userProfile: UserProfile | null = null;
    isGeneratingPdf = false;

    // Form data
    formData: InvoiceFormData = this.getEmptyForm();

    // Country & Tax State
    countries = COUNTRIES_CONFIG;
    countryCode = 'TR';
    countryName = 'Türkiye';
    taxLabel = 'KDV';
    taxRate = 20;
    availableTaxRates: number[] = [20, 10, 1, 0];

    // Delete confirmation
    showDeleteConfirm = false;
    deletingInvoiceId: string | null = null;

    // Status options
    get statusOptions(): { value: Invoice['status']; label: string; color: string }[] {
        return this.lang.cached('invoiceList.statusOptions', () => [
            { value: 'draft', label: this.lang.t('status.draft'), color: 'bg-slate-100 text-slate-700' },
            { value: 'sent', label: this.lang.t('status.sent'), color: 'bg-blue-100 text-blue-700' },
            { value: 'paid', label: this.lang.t('status.paid'), color: 'bg-green-100 text-green-700' },
            { value: 'overdue', label: this.lang.t('status.overdue'), color: 'bg-red-100 text-red-700' },
            { value: 'cancelled', label: this.lang.t('status.cancelled'), color: 'bg-gray-100 text-gray-500' }
        ]);
    }

    ngOnInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.loadInvoices();
            this.loadCustomers();
            this.loadUserProfile();
        }
    }

    private loadUserProfile() {
        this.authService.userProfile$.subscribe(profile => {
            this.userProfile = profile;
        });
    }

    private loadInvoices(): void {
        this.isLoading = true;
        this.invoiceService.getInvoices().subscribe({
            next: (data) => {
                this.invoices = data;
                this.filterInvoices();
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Faturalar yüklenirken hata:', err);
                this.isLoading = false;
            }
        });
    }

    private loadCustomers(): void {
        this.customerService.getCustomers().subscribe({
            next: (data) => {
                this.customers = data;
            }
        });
    }

    filterInvoices(): void {
        let result = [...this.invoices];

        // Belge Türü Filtresi
        if (this.typeFilter !== 'all') {
            result = result.filter(inv => (inv.invoiceType || 'commercial') === this.typeFilter);
        }

        // Ödeme Durumu Filtresi
        if (this.statusFilter !== 'all') {
            result = result.filter(inv => inv.status === this.statusFilter);
        }

        // Onay Filtresi
        if (this.approvalFilter !== 'all') {
            if (this.approvalFilter === 'pending_approval') {
                result = result.filter(inv => !inv.approvalStatus || inv.approvalStatus === 'pending_approval');
            } else {
                result = result.filter(inv => inv.approvalStatus === this.approvalFilter);
            }
        }

        // Vade Filtresi
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (this.vadeFilter === 'overdue') {
            result = result.filter(inv => this.isOverdue(inv));
        } else if (this.vadeFilter === 'this_week') {
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            result = result.filter(inv => {
                if (!inv.dueDate || inv.status === 'paid' || inv.status === 'cancelled') return false;
                const d = new Date(inv.dueDate);
                return d >= today && d <= nextWeek;
            });
        }

        if (this.searchTerm.trim()) {
            const term = this.searchTerm.toLowerCase();
            result = result.filter(inv =>
                inv.invoiceNo.toLowerCase().includes(term) ||
                inv.customerName.toLowerCase().includes(term)
            );
        }

        this.filteredInvoices = result;
        this.currentPage = 1;
    }

    // Vade Helpers
    isOverdue(invoice: Invoice): boolean {
        if (!invoice.dueDate || invoice.status === 'paid' || invoice.status === 'cancelled') return false;
        const due = new Date(invoice.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return due < today;
    }

    getDaysOverdue(dueDate: string | Date | undefined): number {
        if (!dueDate) return 0;
        const due = new Date(dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = today.getTime() - due.getTime();
        return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    sendDueReminder(invoice: Invoice): void {
        const days = this.getDaysOverdue(invoice.dueDate);
        const message = encodeURIComponent(
            this.lang.t('invoices.reminderMsg', {
                name: invoice.customerName,
                no: invoice.invoiceNo,
                amount: '₺' + (invoice.total || 0).toLocaleString(this.lang.locale, { minimumFractionDigits: 2 }),
                date: new Date(invoice.dueDate).toLocaleDateString(this.lang.locale),
                when: days > 0 ? this.lang.t('invoices.reminderPassed', { days }) : this.lang.t('invoices.reminderApproaching')
            })
        );
        window.open(`https://wa.me/?text=${message}`, '_blank');
        this.alertService.toast(this.lang.t('invoices.reminderReady'), 'info');
    }

    // Onay Mekanizması
    async approveInvoice(invoice: Invoice): Promise<void> {
        if (!invoice.id) return;
        try {
            await this.invoiceService.updateApprovalStatus(invoice.id, 'approved');
            invoice.approvalStatus = 'approved';
            this.alertService.toast(this.lang.t('invoices.approvedToast', { no: invoice.invoiceNo }), 'success');
            this.loadInvoices();
        } catch (error: any) {
            this.alertService.error(this.lang.t('common.error'), this.lang.t('invoices.approveFailed', { error: error?.message || error }));
        }
    }

    async rejectInvoice(invoice: Invoice): Promise<void> {
        if (!invoice.id) return;
        try {
            await this.invoiceService.updateApprovalStatus(invoice.id, 'rejected');
            invoice.approvalStatus = 'rejected';
            this.alertService.toast(this.lang.t('invoices.rejectedToast', { no: invoice.invoiceNo }), 'info');
            this.loadInvoices();
        } catch (error: any) {
            this.alertService.error(this.lang.t('common.error'), this.lang.t('invoices.rejectFailed', { error: error?.message || error }));
        }
    }

    getApprovalBadge(status?: string): { label: string; color: string; icon: string } {
        switch (status) {
            case 'approved':
                return { label: this.lang.t('approval.approved'), color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: 'check_circle' };
            case 'rejected':
                return { label: this.lang.t('approval.rejected'), color: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800', icon: 'cancel' };
            default:
                return { label: this.lang.t('approval.pending'), color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', icon: 'pending' };
        }
    }

    // Şablon Seçimi
    setTemplate(templateId: 'classic' | 'modern' | 'tech' | 'formal'): void {
        this.selectedTemplateId = templateId;
        if (this.previewInvoice) {
            this.previewInvoice.templateId = templateId;
        }
    }

    // Kalem KDV Hesaplamaları
    calculateLineTax(item: InvoiceItem): number {
        const gross = item.quantity * item.unitPrice;
        const net = gross * (1 - ((item.discount || 0) / 100));
        const rate = item.taxRate !== undefined ? Number(item.taxRate) : this.taxRate;
        return net * (rate / 100);
    }

    calculateLineTotal(item: InvoiceItem): number {
        const net = this.calculateItemTotal(item);
        const tax = this.calculateLineTax(item);
        return net + tax;
    }

    // Pagination getters
    get totalPages(): number {
        return Math.ceil(this.filteredInvoices.length / this.pageSize) || 1;
    }

    get paginatedInvoices(): Invoice[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.filteredInvoices.slice(start, start + this.pageSize);
    }

    setPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
        }
    }

    // Selection methods
    toggleSelection(id: string): void {
        if (this.selectedIds.has(id)) {
            this.selectedIds.delete(id);
        } else {
            this.selectedIds.add(id);
        }
    }

    toggleSelectAll(): void {
        if (this.selectedIds.size === this.paginatedInvoices.length) {
            this.selectedIds.clear();
        } else {
            this.paginatedInvoices.forEach(inv => {
                if (inv.id) this.selectedIds.add(inv.id);
            });
        }
    }

    isSelected(id: string): boolean {
        return this.selectedIds.has(id);
    }

    get isAllSelected(): boolean {
        return this.paginatedInvoices.length > 0 &&
            this.selectedIds.size === this.paginatedInvoices.length;
    }

    // Modal methods
    async openAddModal(): Promise<void> {
        const currentUser = this.authService.currentUser;
        if (currentUser) {
            const profile = await this.userService.getUserProfile(currentUser.uid);
            if (profile && (profile.plan === 'free' || !profile.plan)) {
                if (this.invoices.length >= (profile.monthlyInvoiceLimit || 5)) {
                    this.alertService.warning(this.lang.t('plans.limitTitle'), this.lang.t('plans.limitReachedShort'));
                    this.router.navigate(['/pricing']);
                    return;
                }
            }
        }

        this.formData = this.getEmptyForm();
        this.formData.invoiceNo = this.invoiceService.generateInvoiceNumber();
        this.isEditing = false;
        this.editingInvoiceId = null;
        this.setCountryDetails('TR');
        this.showModal = true;
    }

    openEditModal(invoice: Invoice): void {
        this.formData = {
            invoiceNo: invoice.invoiceNo,
            invoiceType: invoice.invoiceType || 'commercial',
            customerId: invoice.customerId || '',
            customerName: invoice.customerName,
            customerEmail: invoice.customerEmail,
            customerTaxId: invoice.customerTaxId || '',
            customerAddress: invoice.customerAddress || '',
            date: typeof invoice.date === 'string' ? invoice.date : (invoice.date as any)?.toISOString?.().split('T')[0] || new Date().toISOString().split('T')[0],
            dueDate: typeof invoice.dueDate === 'string' ? invoice.dueDate : (invoice.dueDate as any)?.toISOString?.().split('T')[0] || new Date().toISOString().split('T')[0],
            countryCode: invoice.countryCode || 'TR',
            taxLabel: invoice.taxLabel || this.lang.t('doc.vat'),
            taxRate: invoice.taxRate || 20,
            items: invoice.items.map(i => ({ ...i })),
            additionalTaxes: invoice.additionalTaxes ? invoice.additionalTaxes.map(t => ({ ...t })) : [],
            notes: invoice.notes,
            status: invoice.status
        };
        this.setCountryDetails(this.formData.countryCode || 'TR');
        this.isEditing = true;
        this.editingInvoiceId = invoice.id || null;
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.isEditing = false;
        this.editingInvoiceId = null;
        this.formData = this.getEmptyForm();
    }

    async saveInvoice(): Promise<void> {
        if (!this.formData.customerName || !this.formData.date) {
            this.alertService.warning(this.lang.t('common.missingInfo'), this.lang.t('invoices.customerDateRequired'));
            return;
        }

        if (this.formData.items.length === 0) {
            this.alertService.warning(this.lang.t('invoices.itemRequiredTitle'), this.lang.t('invoices.itemRequired'));
            return;
        }

        const invoiceData: InvoiceFormData = {
            ...this.formData,
            items: this.formData.items.map(item => ({
                ...item,
                taxAmount: this.calculateLineTax(item),
                totalWithTax: this.calculateLineTotal(item)
            })),
            countryCode: this.countryCode,
            taxLabel: this.taxLabel,
            taxRate: this.taxRate
        };

        this.isSaving = true;
        try {
            if (this.isEditing && this.editingInvoiceId) {
                await this.invoiceService.updateInvoice(this.editingInvoiceId, invoiceData);
                this.alertService.toast(this.lang.t('invoices.updatedToast'), 'success');
            } else {
                await this.invoiceService.createInvoice(invoiceData);
                this.alertService.toast(this.lang.t('invoices.createdToast'), 'success');
            }
            this.closeModal();
            this.loadInvoices();
        } catch (error: any) {
            console.error('Fatura kaydedilirken hata:', error);
            this.alertService.error(this.lang.t('common.error'), this.lang.t('invoices.saveFailed', { error: error?.message || error }));
        } finally {
            this.isSaving = false;
        }
    }

    // Customer selection
    onCustomerSelect(customerId: string): void {
        const customer = this.customers.find(c => c.id === customerId);
        if (customer) {
            this.formData.customerId = customer.id;
            this.formData.customerName = customer.name;
            this.formData.customerEmail = customer.email;
            this.formData.customerTaxId = customer.taxId || '';
            this.formData.customerAddress = customer.address || '';
        }
    }

    // Country selection
    setCountryDetails(code: string) {
        const details = COUNTRY_MAP[code] || COUNTRIES_CONFIG[0];
        this.countryName = details.defaultName;
        this.taxLabel = details.taxLabel;
        this.taxRate = details.defaultRate;
        this.availableTaxRates = details.rates.map(r => r.rate);
        this.formData.countryCode = code;
        this.formData.taxRate = this.taxRate;
        this.formData.taxLabel = this.taxLabel;
    }

    onCountryChange(code: string) {
        this.setCountryDetails(code);
    }

    // Additional Taxes
    addAdditionalTax() {
        if (!this.formData.additionalTaxes) {
            this.formData.additionalTaxes = [];
        }
        this.formData.additionalTaxes.push({ name: this.lang.t('create.extraTaxDefault'), rate: 0 });
    }

    removeAdditionalTax(index: number) {
        if (this.formData.additionalTaxes) {
            this.formData.additionalTaxes.splice(index, 1);
        }
    }

    // Item methods
    addItem(): void {
        this.formData.items.push({
            description: '',
            quantity: 1,
            unitPrice: 0,
            taxRate: this.taxRate,
            discount: 0
        });
    }

    removeItem(index: number): void {
        this.formData.items.splice(index, 1);
    }

    calculateItemTotal(item: InvoiceItem): number {
        const gross = item.quantity * item.unitPrice;
        const discountAmount = gross * ((item.discount || 0) / 100);
        return gross - discountAmount;
    }

    // Calculations
    get formSubtotal(): number {
        return this.formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    }

    get formTotalDiscount(): number {
        return this.formData.items.reduce((sum, item) => {
            const gross = item.quantity * item.unitPrice;
            return sum + (gross * ((item.discount || 0) / 100));
        }, 0);
    }

    get formNetSubtotal(): number {
        return this.formSubtotal - this.formTotalDiscount;
    }

    get formTaxTotal(): number {
        return this.formData.items.reduce((sum, item) => {
            const gross = item.quantity * item.unitPrice;
            const discountAmount = gross * ((item.discount || 0) / 100);
            const net = gross - discountAmount;
            const rate = item.taxRate !== undefined ? Number(item.taxRate) : this.taxRate;
            return sum + (net * (rate / 100));
        }, 0);
    }

    get formAdditionalTaxTotal(): number {
        if (!this.formData.additionalTaxes) return 0;
        return this.formData.additionalTaxes.reduce((sum, tax) => {
            return sum + (this.formNetSubtotal * (tax.rate / 100));
        }, 0);
    }

    get formTotal(): number {
        return this.formNetSubtotal + this.formTaxTotal + this.formAdditionalTaxTotal;
    }

    // Preview & PDF
    openPreviewModal(invoice: Invoice): void {
        this.previewInvoice = invoice;
        this.selectedTemplateId = (invoice.templateId as any) || 'classic';
        this.showPreviewModal = true;
    }

    closePreviewModal(): void {
        this.showPreviewModal = false;
        this.previewInvoice = null;
    }

    async downloadPdf(): Promise<void> {
        if (!isPlatformBrowser(this.platformId) || !this.invoicePreviewCardRef?.nativeElement || !this.previewInvoice) return;

        this.isGeneratingPdf = true;
        try {
            const element = this.invoicePreviewCardRef.nativeElement;
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
            pdf.save(`${this.previewInvoice.invoiceNo}.pdf`);
        } catch (error) {
            console.error('PDF oluşturma hatası:', error);
        } finally {
            this.isGeneratingPdf = false;
        }
    }

    printInvoice(): void {
        if (isPlatformBrowser(this.platformId)) {
            window.print();
        }
    }

    exportToCsv(): void {
        if (this.filteredInvoices.length === 0) return;
        const headers = [this.lang.t('table.invoiceNo'), this.lang.t('preview.customerName'), this.lang.t('csv.email'), this.lang.t('table.date'), this.lang.t('csv.dueDate'), this.lang.t('csv.amount'), this.lang.t('table.status')];
        const rows = this.filteredInvoices.map(inv => [
            `"${inv.invoiceNo}"`,
            `"${inv.customerName}"`,
            `"${inv.customerEmail || ''}"`,
            `"${inv.date}"`,
            `"${inv.dueDate}"`,
            `"${inv.total || 0}"`,
            `"${this.getStatusLabel(inv.status)}"`
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${this.lang.t('csv.invoicesFile')}_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
    }

    // Delete methods
    confirmDelete(id: string): void {
        this.deletingInvoiceId = id;
        this.showDeleteConfirm = true;
    }

    cancelDelete(): void {
        this.showDeleteConfirm = false;
        this.deletingInvoiceId = null;
    }

    async deleteInvoice(): Promise<void> {
        if (!this.deletingInvoiceId) return;

        try {
            await this.invoiceService.deleteInvoice(this.deletingInvoiceId);
            this.selectedIds.delete(this.deletingInvoiceId);
            this.loadInvoices();
        } catch (error) {
            console.error('Fatura silinirken hata:', error);
        } finally {
            this.cancelDelete();
        }
    }

    async deleteSelected(): Promise<void> {
        if (this.selectedIds.size === 0) return;

        try {
            await this.invoiceService.deleteInvoices(Array.from(this.selectedIds));
            this.selectedIds.clear();
            this.loadInvoices();
        } catch (error) {
            console.error('Faturalar silinirken hata:', error);
        }
    }

    // Status methods
    async updateStatus(invoice: Invoice, status: Invoice['status']): Promise<void> {
        if (!invoice.id) return;
        try {
            await this.invoiceService.updateInvoiceStatus(invoice.id, status);
            this.loadInvoices();
        } catch (error) {
            console.error('Durum güncellenirken hata:', error);
        }
    }

    getStatusColor(status: string): string {
        const option = this.statusOptions.find(s => s.value === status);
        return option?.color || 'bg-gray-100 text-gray-700';
    }

    getStatusLabel(status: string): string {
        const option = this.statusOptions.find(s => s.value === status);
        return option?.label || status;
    }

    // Helpers
    private formatDateForInput(date: Date | string): string {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }

    private getEmptyForm(): InvoiceFormData {
        const today = new Date();
        const dueDate = new Date();
        dueDate.setDate(today.getDate() + 14);

        return {
            invoiceNo: '',
            invoiceType: 'commercial',
            date: today.toISOString().split('T')[0],
            dueDate: dueDate.toISOString().split('T')[0],
            customerName: '',
            customerEmail: '',
            customerTaxId: '',
            customerAddress: '',
            items: [{
                description: '',
                quantity: 1,
                unitPrice: 0,
                discount: 0
            }],
            notes: '',
            status: 'draft',
            countryCode: 'TR',
            additionalTaxes: []
        };
    }
}
