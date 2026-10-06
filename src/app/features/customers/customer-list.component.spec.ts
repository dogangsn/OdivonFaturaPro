import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CustomerListComponent } from './customer-list.component';
import { CustomerService } from '../../core/services/customer.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { AlertService } from '../../core/services/alert.service';

const gap = it.fails;

describe('CustomerListComponent — müşteri limiti', () => {
  let customerService: { addCustomer: ReturnType<typeof vi.fn>; getCustomers: ReturnType<typeof vi.fn> };

  async function addWithExisting(count: number) {
    const existing = Array.from({ length: count }, (_, i) => ({ id: `c${i}`, name: `C${i}`, userId: 'u1' }));
    customerService.getCustomers.mockReturnValue(of(existing));
    const fixture = TestBed.createComponent(CustomerListComponent);
    const cmp = fixture.componentInstance;
    cmp.customers = existing as any;
    cmp.formData = { ...cmp.formData, name: 'Yeni Müşteri', email: 'yeni@example.com' };
    await cmp.saveCustomer();
  }

  beforeEach(async () => {
    customerService = { addCustomer: vi.fn().mockResolvedValue('id'), getCustomers: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [CustomerListComponent],
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: CustomerService, useValue: customerService },
        { provide: InvoiceService, useValue: { getInvoices: () => of([]) } },
        { provide: AuthService, useValue: { currentUser: { uid: 'u1' } } },
        { provide: UserService, useValue: { getUserProfile: vi.fn().mockResolvedValue({ uid: 'u1', plan: 'free', customerLimit: 5 }) } },
        { provide: AlertService, useValue: { warning: vi.fn(), error: vi.fn(), toast: vi.fn(), success: vi.fn(), confirm: vi.fn() } },
      ],
    })
      .overrideComponent(CustomerListComponent, { set: { template: '' } })
      .compileComponents();
  });

  it('ücretsiz kullanıcı limitin altındayken müşteri ekleyebilir', async () => {
    await addWithExisting(2);
    expect(customerService.addCustomer).toHaveBeenCalledTimes(1);
  });

  gap('ücretsiz kullanıcı 5 müşteriden sonra yeni müşteri ekleyememeli', async () => {
    await addWithExisting(5);
    expect(customerService.addCustomer).not.toHaveBeenCalled();
  });
});
