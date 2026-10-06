import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { InvoiceService } from './invoice.service';
import { InvoiceFormData } from '../models/invoice.model';

// `gap(...)`: bilinen bir eksikliği belgeler. Düzeltildiğinde test kırmızıya döner; o zaman `it` yapın.
const gap = it.fails;

function form(partial: Partial<InvoiceFormData>): InvoiceFormData {
  return { taxRate: 20, items: [], ...partial } as unknown as InvoiceFormData;
}

describe('InvoiceService', () => {
  let service: InvoiceService;
  let totals: (data: InvoiceFormData) => { subtotal: number; taxTotal: number; total: number };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    service = TestBed.inject(InvoiceService);
    totals = (data) => (service as any).calculateTotals(data);
  });

  describe('tutar hesaplama', () => {
    it('satır KDV, iskonto ve genel toplamı doğru hesaplar', () => {
      const result = totals(form({
        items: [
          { description: 'A', quantity: 2, unitPrice: 100, taxRate: 20 },
          { description: 'B', quantity: 1, unitPrice: 50, taxRate: 10, discount: 10 },
        ] as any,
      }));
      expect(result.subtotal).toBe(250); // iskonto öncesi brüt
      expect(result.taxTotal).toBeCloseTo(44.5, 10); // 200*%20 + 45*%10
      expect(result.total).toBeCloseTo(289.5, 10); // 245 net + 44.5 KDV
    });

    it('satırda oran yoksa faturanın KDV oranını kullanır', () => {
      const result = totals(form({ taxRate: 10, items: [{ description: 'A', quantity: 1, unitPrice: 100 }] as any }));
      expect(result.taxTotal).toBe(10);
      expect(result.total).toBe(110);
    });

    it('ek vergileri iskontolu matrah üzerinden ekler', () => {
      const result = totals(form({
        items: [{ description: 'A', quantity: 1, unitPrice: 1000, taxRate: 20, discount: 10 }] as any,
        additionalTaxes: [{ name: 'ÖTV', rate: 5 }] as any,
      }));
      expect(result.taxTotal).toBe(180 + 45);
      expect(result.total).toBe(900 + 225);
    });

    it('boş faturada sıfır döner', () => {
      expect(totals(form({ items: [] as any }))).toEqual({ subtotal: 0, taxTotal: 0, total: 0 });
    });

    it('kaydedilen tutarlar kuruşa (2 ondalık) yuvarlanmalı', () => {
      const result = totals(form({ items: [{ description: 'A', quantity: 3, unitPrice: 0.1, taxRate: 18 }] as any }));
      expect(result.taxTotal).toBe(0.05);
      expect(result.total).toBe(0.35);
    });
  });

  describe('fatura numarası', () => {
    it('yıl ve 6 haneli sıra numarasıyla biçimlenir', () => {
      expect(service.formatInvoiceNumber(2026, 1)).toBe('INV-2026-000001');
      expect(service.formatInvoiceNumber(2026, 1234)).toBe('INV-2026-001234');
    });

    it('ardışık sıra numaraları farklı ve sıralı numara üretir', () => {
      const numbers = [1, 2, 3].map(seq => service.formatInvoiceNumber(2026, seq));
      expect(new Set(numbers).size).toBe(3);
      expect([...numbers].sort()).toEqual(numbers);
    });
  });
});
