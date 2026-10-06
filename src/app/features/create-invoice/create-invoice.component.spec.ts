import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { CreateInvoiceComponent } from './create-invoice.component';
import { InvoiceService } from '../../core/services/invoice.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { AiScannerService } from '../../core/services/ai-scanner.service';
import { AlertService } from '../../core/services/alert.service';

const gap = it.fails;

function invoicesOn(count: number, date: Date) {
  return Array.from({ length: count }, (_, i) => ({ id: `i${i}`, date: date.toISOString().split('T')[0], createdAt: date }));
}

describe('CreateInvoiceComponent — plan limiti', () => {
  let invoiceService: { getInvoices: ReturnType<typeof vi.fn>; createInvoice: ReturnType<typeof vi.fn> };
  let profile: Record<string, unknown>;

  async function save(existing: unknown[]) {
    invoiceService.getInvoices.mockReturnValue(of(existing));
    const fixture = TestBed.createComponent(CreateInvoiceComponent);
    const cmp = fixture.componentInstance;
    cmp.invoiceForm.patchValue({ customerName: 'Müşteri A.Ş.' });
    cmp.items.at(0).patchValue({ description: 'Danışmanlık', quantity: 1, unitPrice: 1000 });
    await cmp.saveInvoice();
  }

  beforeEach(async () => {
    profile = { uid: 'u1', plan: 'free', monthlyInvoiceLimit: 5 };
    invoiceService = {
      getInvoices: vi.fn(),
      createInvoice: vi.fn().mockResolvedValue('new-id'),
    };
    await TestBed.configureTestingModule({
      imports: [CreateInvoiceComponent],
      providers: [
        provideRouter([]),
        { provide: InvoiceService, useValue: invoiceService },
        { provide: AuthService, useValue: { currentUser: { uid: 'u1' } } },
        { provide: UserService, useValue: { getUserProfile: vi.fn(async () => profile) } },
        { provide: AiScannerService, useValue: {} },
        {
          provide: AlertService,
          useValue: { warning: vi.fn(), error: vi.fn(), loading: vi.fn(), success: vi.fn().mockResolvedValue(true), confirm: vi.fn().mockResolvedValue(false) },
        },
      ],
    })
      .overrideComponent(CreateInvoiceComponent, { set: { template: '' } })
      .compileComponents();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  it('ücretsiz kullanıcı limitin altındayken fatura kesebilir', async () => {
    await save(invoicesOn(4, new Date()));
    expect(invoiceService.createInvoice).toHaveBeenCalledTimes(1);
  });

  it('ücretsiz kullanıcı bu ay 5 fatura kestiyse engellenir ve fiyatlandırmaya yönlendirilir', async () => {
    await save(invoicesOn(5, new Date()));
    expect(invoiceService.createInvoice).not.toHaveBeenCalled();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/pricing']);
  });

  it('Pro kullanıcı limitsiz fatura kesebilir', async () => {
    profile = { uid: 'u1', plan: 'pro', monthlyInvoiceLimit: 999999 };
    await save(invoicesOn(50, new Date()));
    expect(invoiceService.createInvoice).toHaveBeenCalledTimes(1);
  });

  it('aylık limit her ay sıfırlanmalı: geçen ayki 5 fatura bu ayı engellememeli', async () => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    await save(invoicesOn(5, lastMonth));
    expect(invoiceService.createInvoice).toHaveBeenCalledTimes(1);
  });
});
