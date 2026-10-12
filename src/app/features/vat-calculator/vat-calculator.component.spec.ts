import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { VatCalculatorComponent } from './vat-calculator.component';
import { LanguageService } from '../../core/services/language.service';

describe('VatCalculatorComponent — KDV hesaplayıcı', () => {
  function create(lang: 'tr' | 'de' = 'tr') {
    TestBed.configureTestingModule({ imports: [VatCalculatorComponent], providers: [provideRouter([])] });
    TestBed.inject(LanguageService).setLanguage(lang);
    return TestBed.createComponent(VatCalculatorComponent).componentInstance;
  }

  it('arayüz diline göre ülkeyi ve genel oranı seçer', () => {
    const tr = create('tr');
    expect(tr.countryCode()).toBe('TR');
    expect(tr.rate()).toBe(20);
  });

  it('net tutara KDV ekler', () => {
    const c = create();
    c.amount.set(1000);
    expect(c.result().tax).toBeCloseTo(200);
    expect(c.result().gross).toBeCloseTo(1200);
  });

  it('KDV dahil tutardan KDV\'yi ayırır', () => {
    const c = create();
    c.mode.set('remove');
    c.amount.set(1200);
    expect(c.result().net).toBeCloseTo(1000);
    expect(c.result().tax).toBeCloseTo(200);
  });

  it('ülke değişince o ülkenin genel oranına geçer', () => {
    const c = create();
    c.setCountry('DE');
    expect(c.rate()).toBe(19);
    expect(c.country().currency).toBe('EUR');
  });
});
