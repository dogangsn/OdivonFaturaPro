import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { InvoiceService } from '../../core/services/invoice.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { InvoiceFormData } from '../../core/models/invoice.model';
import { LanguageService } from '../../core/services/language.service';
import { AiScannerService, ScannedDocumentResult } from '../../core/services/ai-scanner.service';
import { AlertService } from '../../core/services/alert.service';
import { COUNTRIES_CONFIG, COUNTRY_MAP, CountryConfig, TaxRateOption } from '../../core/constants/countries.constant';
import { firstValueFrom } from 'rxjs';
import { canCreateInvoice, isFreePlan } from '../../core/utils/plan-limits';

@Component({
    selector: 'app-create-invoice',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, ButtonComponent, InputComponent],
    templateUrl: './create-invoice.component.html',
    styleUrl: './create-invoice.component.css'
})
export class CreateInvoiceComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private invoiceService = inject(InvoiceService);
    private authService = inject(AuthService);
    private userService = inject(UserService);
    private aiScannerService = inject(AiScannerService);
    private alertService = inject(AlertService);
    private platformId = inject(PLATFORM_ID);
    lang = inject(LanguageService);

    invoiceForm: FormGroup;
    countries: CountryConfig[] = COUNTRIES_CONFIG;
    countryCode: string = 'TR';
    countryName: string = 'Türkiye';
    taxLabel: string = 'KDV';
    taxRate: number = 20;
    currency: string = 'TRY';
    currencySymbol: string = '₺';
    availableTaxRates: number[] = [20, 10, 1, 0];
    currentTaxRateOptions: TaxRateOption[] = COUNTRIES_CONFIG[0].rates;
    isSaving: boolean = false;
    activeMobileTab: 'form' | 'preview' = 'form';

    // AI Scanner states
    showScannerModal: boolean = false;
    isScanning: boolean = false;
    scannedResult: ScannedDocumentResult | null = null;
    scannerPreviewUrl: string | null = null;
    scannerError: string | null = null;


    constructor() {
        this.invoiceForm = this.fb.group({
            invoiceType: ['commercial', Validators.required],
            countryCode: ['TR'],
            date: [new Date().toISOString().split('T')[0], Validators.required],
            dueDate: [new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]],
            time: ['14:30'],
            customerName: ['', Validators.required],
            customerEmail: [''],
            customerTaxId: [''],
            customerAddress: [''],
            taxId: [''],
            address: [''],
            items: this.fb.array([]),
            additionalTaxes: this.fb.array([])
        });

        // Add initial item
        this.addItem();
    }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            if (params['type'] === 'proforma') {
                this.invoiceForm.patchValue({ invoiceType: 'proforma' });
            }
            const code = params['countryCode'] || 'TR';
            const rateParam = params['taxRate'] !== undefined ? Number(params['taxRate']) : undefined;
            this.countryCode = code;
            this.invoiceForm.patchValue({ countryCode: code });
            this.setCountryDetails(code, rateParam);
            this.updateItemsTaxRate(this.taxRate);

            // Giriş yapmış kullanıcı için bekleyen taslak fatura varsa otomatik geri yükle
            if (isPlatformBrowser(this.platformId)) {
                const savedDraft = sessionStorage.getItem('pending_invoice_draft');
                if (savedDraft) {
                    try {
                        const draft = JSON.parse(savedDraft);
                        if (draft.formValue) {
                            this.invoiceForm.patchValue({
                                invoiceType: draft.formValue.invoiceType,
                                date: draft.formValue.date,
                                dueDate: draft.formValue.dueDate,
                                customerName: draft.formValue.customerName,
                                customerEmail: draft.formValue.customerEmail,
                                customerTaxId: draft.formValue.customerTaxId || draft.formValue.taxId,
                                customerAddress: draft.formValue.customerAddress || draft.formValue.address,
                            });
                            if (draft.formValue.items && draft.formValue.items.length > 0) {
                                while (this.items.length) {
                                    this.items.removeAt(0);
                                }
                                draft.formValue.items.forEach((it: any) => {
                                    this.items.push(this.fb.group({
                                        description: [it.description, Validators.required],
                                        quantity: [it.quantity, [Validators.required, Validators.min(1)]],
                                        unitPrice: [it.unitPrice, [Validators.required, Validators.min(0)]],
                                        taxRate: [it.taxRate !== undefined ? it.taxRate : this.taxRate],
                                        discount: [it.discount || 0, [Validators.min(0), Validators.max(100)]]
                                    }));
                                });
                            }
                        }
                        if (draft.countryCode) {
                            this.setCountryDetails(draft.countryCode, draft.taxRate);
                            this.invoiceForm.patchValue({ countryCode: draft.countryCode });
                        }
                        sessionStorage.removeItem('pending_invoice_draft');
                        this.alertService.toast(this.lang.t('create.draftRestored'), 'success');
                    } catch (e) {
                        console.error('Taslak fatura yüklenirken hata:', e);
                    }
                }
            }
        });
    }

    onCountryChange(code: string) {
        this.countryCode = code;
        this.invoiceForm.patchValue({ countryCode: code });
        this.setCountryDetails(code);
        this.updateItemsTaxRate(this.taxRate);
    }

    onTaxRateChange(rate: number | string) {
        this.taxRate = Number(rate);
        this.updateItemsTaxRate(this.taxRate);
    }

    updateItemsTaxRate(rate: number) {
        this.items.controls.forEach(control => {
            control.patchValue({ taxRate: rate });
        });
    }

    setCountryDetails(code: string, preferredTaxRate?: number) {
        const details = COUNTRY_MAP[code] || COUNTRIES_CONFIG[0];
        this.countryCode = details.code;
        this.countryName = details.defaultName;
        this.taxLabel = details.taxLabel;
        this.currency = details.currency || 'TRY';
        this.currencySymbol = details.currencySymbol || '₺';
        this.currentTaxRateOptions = details.rates;
        this.availableTaxRates = details.rates.map(r => r.rate);

        if (preferredTaxRate !== undefined && this.availableTaxRates.includes(preferredTaxRate)) {
            this.taxRate = preferredTaxRate;
        } else {
            this.taxRate = details.defaultRate;
        }
    }

    get items() {
        return this.invoiceForm.get('items') as FormArray;
    }

    get additionalTaxes() {
        return this.invoiceForm.get('additionalTaxes') as FormArray;
    }

    addAdditionalTax() {
        const taxForm = this.fb.group({
            name: [this.lang.t('create.extraTaxDefault'), Validators.required],
            rate: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
        });
        this.additionalTaxes.push(taxForm);
    }

    removeAdditionalTax(index: number) {
        this.additionalTaxes.removeAt(index);
    }

    addItem() {
        const itemForm = this.fb.group({
            description: ['', Validators.required],
            quantity: [1, [Validators.required, Validators.min(1)]],
            unitPrice: [0, [Validators.required, Validators.min(0)]],
            taxRate: [this.taxRate],
            discount: [0, [Validators.min(0), Validators.max(100)]]
        });
        this.items.push(itemForm);
    }

    removeItem(index: number) {
        if (this.items.length > 1) {
            this.items.removeAt(index);
        }
    }

    calculateLineNet(index: number): number {
        const item = this.items.at(index).value;
        const sub = (item.quantity || 0) * (item.unitPrice || 0);
        const disc = sub * ((item.discount || 0) / 100);
        return sub - disc;
    }

    calculateLineTax(index: number): number {
        const net = this.calculateLineNet(index);
        const item = this.items.at(index).value;
        const rate = item.taxRate !== undefined ? Number(item.taxRate) : this.taxRate;
        return net * (rate / 100);
    }

    calculateLineTotal(index: number): number {
        return this.calculateLineNet(index) + this.calculateLineTax(index);
    }

    calculateSubtotal(): number {
        return this.items.controls.reduce((sum, item) => {
            const val = item.value;
            return sum + ((val.quantity || 0) * (val.unitPrice || 0));
        }, 0);
    }

    calculateDiscount(): number {
        return this.items.controls.reduce((sum, item) => {
            const val = item.value;
            const sub = (val.quantity || 0) * (val.unitPrice || 0);
            return sum + (sub * ((val.discount || 0) / 100));
        }, 0);
    }

    calculateNetSubtotal(): number {
        return this.calculateSubtotal() - this.calculateDiscount();
    }

    calculateTax(): number {
        return this.items.controls.reduce((sum, _, index) => {
            return sum + this.calculateLineTax(index);
        }, 0);
    }

    calculateAdditionalTaxTotal(): number {
        return this.additionalTaxes.controls.reduce((acc, tax) => {
            const rate = tax.get('rate')?.value || 0;
            return acc + (this.calculateNetSubtotal() * (rate / 100));
        }, 0);
    }

    calculateTotal(): number {
        const netSubtotal = this.calculateNetSubtotal();
        const baseTax = this.calculateTax();
        const addTaxes = this.calculateAdditionalTaxTotal();
        return netSubtotal + baseTax + addTaxes;
    }

    goBack() {
        this.router.navigate(['/']);
    }

    async saveInvoice() {
        if (this.invoiceForm.invalid) {
            this.alertService.warning(this.lang.t('common.missingInfo'), this.lang.t('common.fillRequired'));
            return;
        }

        // Misafir Kullanıcı Kontrolü: Giriş yapmamışsa verileri koru ve login/register'a yönlendir
        const currentUser = this.authService.currentUser;
        if (!currentUser) {
            if (isPlatformBrowser(this.platformId)) {
                const draftData = {
                    formValue: this.invoiceForm.value,
                    countryCode: this.countryCode,
                    taxRate: this.taxRate
                };
                sessionStorage.setItem('pending_invoice_draft', JSON.stringify(draftData));
            }
            const confirmed = await this.alertService.confirm(
                this.lang.t('create.loginRequiredTitle'),
                this.lang.t('create.loginRequiredText'),
                this.lang.t('create.loginOrRegister'),
                this.lang.t('common.cancelShort')
            );
            if (confirmed) {
                this.router.navigate(['/login'], { queryParams: { returnUrl: '/create-invoice' } });
            }
            return;
        }

        // Ücretsiz Plan aylık fatura limiti (her takvim ayı sıfırlanır)
        const profile = await this.userService.getUserProfile(currentUser.uid);
        if (isFreePlan(profile)) {
            const existingInvoices = await firstValueFrom(this.invoiceService.getInvoices());
            if (!canCreateInvoice(profile, existingInvoices)) {
                this.alertService.warning(this.lang.t('plans.limitTitle'), this.lang.t('plans.limitReached'));
                this.router.navigate(['/pricing']);
                return;
            }
        }

        this.isSaving = true;
        this.alertService.loading(this.lang.t('create.saving'));
        try {
            const val = this.invoiceForm.value;
            const invoiceData: InvoiceFormData = {
                invoiceNo: '', // kaydederken sıralı numara atanır
                invoiceType: val.invoiceType || 'commercial',
                date: val.date,
                dueDate: val.dueDate || val.date,
                customerName: val.customerName,
                customerEmail: val.customerEmail || '',
                customerTaxId: val.customerTaxId || val.taxId || '',
                customerAddress: val.customerAddress || val.address || '',
                items: val.items.map((it: any, idx: number) => ({
                    ...it,
                    taxRate: Number(it.taxRate !== undefined ? it.taxRate : this.taxRate),
                    taxAmount: this.calculateLineTax(idx),
                    totalWithTax: this.calculateLineTotal(idx)
                })),
                additionalTaxes: val.additionalTaxes || [],
                countryCode: this.countryCode,
                taxLabel: this.taxLabel,
                taxRate: this.taxRate,
                currency: this.currency,
                currencySymbol: this.currencySymbol,
                notes: '',
                status: val.invoiceType === 'proforma' ? 'draft' : 'sent',
                approvalStatus: 'approved'
            };

            await this.invoiceService.createInvoice(invoiceData);
            await this.alertService.success(this.lang.t('common.success'), this.lang.t('create.savedSuccess', { type: val.invoiceType === 'proforma' ? this.lang.t('invoiceType.proformaInvoice') : this.lang.t('invoiceType.salesInvoice') }));
            this.router.navigate(['/invoices']);
        } catch (error) {
            console.error('Fatura kaydedilirken hata:', error);
            this.alertService.error(this.lang.t('common.error'), this.lang.t('create.saveError'));
        } finally {
            this.isSaving = false;
        }
    }

    // AI Scanner Integration
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
            console.error('AI Invoice scanning failed:', err);
            this.scannerError = err.message || this.lang.t('scanner.error');
        } finally {
            this.isScanning = false;
        }
    }

    applyScannedDataToInvoice(): void {
        if (!this.scannedResult) return;

        // Customer / Merchant
        if (this.scannedResult.merchantName) {
            this.invoiceForm.patchValue({ customerName: this.scannedResult.merchantName });
        }

        // Date
        if (this.scannedResult.date) {
            this.invoiceForm.patchValue({ date: this.scannedResult.date });
        }

        // Tax Rate
        if (this.scannedResult.taxRate !== undefined && this.availableTaxRates.includes(this.scannedResult.taxRate)) {
            this.taxRate = this.scannedResult.taxRate;
        }

        // Items
        if (this.scannedResult.items && this.scannedResult.items.length > 0) {
            // Clear current items
            while (this.items.length !== 0) {
                this.items.removeAt(0);
            }

            for (const item of this.scannedResult.items) {
                const itemForm = this.fb.group({
                    description: [item.description || this.lang.t('scanner.defaultItem'), Validators.required],
                    quantity: [item.quantity || 1, [Validators.required, Validators.min(1)]],
                    unitPrice: [item.unitPrice || item.totalPrice || 0, [Validators.required, Validators.min(0)]],
                    taxRate: [item.taxRate !== undefined ? item.taxRate : this.taxRate, [Validators.required, Validators.min(0)]],
                    discount: [0, [Validators.min(0), Validators.max(100)]]
                });
                this.items.push(itemForm);
            }
        } else if (this.scannedResult.totalAmount && this.scannedResult.totalAmount > 0) {
            // Single fallback item with the total amount
            while (this.items.length !== 0) {
                this.items.removeAt(0);
            }
            const singleItem = this.fb.group({
                description: [this.lang.t('scanner.defaultItemTotal'), Validators.required],
                quantity: [1, [Validators.required, Validators.min(1)]],
                unitPrice: [this.scannedResult.totalAmount, [Validators.required, Validators.min(0)]],
                taxRate: [this.scannedResult.taxRate || this.taxRate, [Validators.required, Validators.min(0)]],
                discount: [0, [Validators.min(0), Validators.max(100)]]
            });
            this.items.push(singleItem);
        }

        this.closeScannerModal();
    }
}
