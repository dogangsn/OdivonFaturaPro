import { canAddCustomer, canCreateInvoice, countInvoicesThisMonth } from './plan-limits';

describe('plan limitleri', () => {
  const now = new Date(2026, 9, 15); // 15 Ekim 2026

  it('sadece bu takvim ayındaki faturaları sayar (Timestamp, Date ve tarih metni)', () => {
    const invoices = [
      { createdAt: { seconds: new Date(2026, 9, 1).getTime() / 1000 } },
      { createdAt: new Date(2026, 9, 31) },
      { date: '2026-10-10' },
      { createdAt: new Date(2026, 8, 30) },
      { createdAt: new Date(2025, 9, 15) },
      {},
    ];
    expect(countInvoicesThisMonth(invoices, now)).toBe(3);
  });

  it('ücretsiz plan ayda 5 faturayla sınırlı, ücretli planlar sınırsız', () => {
    const five = Array.from({ length: 5 }, () => ({ createdAt: now }));
    expect(canCreateInvoice({ plan: 'free', monthlyInvoiceLimit: 5 }, five.slice(0, 4), now)).toBe(true);
    expect(canCreateInvoice({ plan: 'free', monthlyInvoiceLimit: 5 }, five, now)).toBe(false);
    expect(canCreateInvoice({ plan: 'pro' }, five, now)).toBe(true);
    expect(canCreateInvoice(null, five, now)).toBe(false);
  });

  it('ücretsiz plan 5 müşteriyle sınırlı', () => {
    expect(canAddCustomer({ plan: 'free', customerLimit: 5 }, 4)).toBe(true);
    expect(canAddCustomer({ plan: 'free', customerLimit: 5 }, 5)).toBe(false);
    expect(canAddCustomer({ plan: 'enterprise' }, 500)).toBe(true);
  });
});
