import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PricingComponent } from './pricing.component';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { AlertService } from '../../core/services/alert.service';
import { LanguageService } from '../../core/services/language.service';

const gap = it.fails;

describe('PricingComponent — ücretli plana geçiş', () => {
  let userService: { getUserProfile: ReturnType<typeof vi.fn>; updateUserProfile: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    userService = {
      getUserProfile: vi.fn().mockResolvedValue({ uid: 'u1', plan: 'free' }),
      updateUserProfile: vi.fn().mockResolvedValue(undefined),
    };
    await TestBed.configureTestingModule({
      imports: [PricingComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { currentUser: { uid: 'u1', email: 'u1@example.com' }, user$: of(null) } },
        { provide: UserService, useValue: userService },
        {
          provide: AlertService,
          useValue: { warning: vi.fn(), error: vi.fn(), loading: vi.fn(), success: vi.fn().mockResolvedValue(true), confirm: vi.fn().mockResolvedValue(true) },
        },
      ],
    }).compileComponents();
  });

  it('üç planı fiyatlarıyla listeler', () => {
    const fixture = TestBed.createComponent(PricingComponent);
    expect(fixture.componentInstance.plans.map(p => [p.id, p.price])).toEqual([
      ['free', '₺0'], ['pro', '₺299'], ['enterprise', '₺799'],
    ]);
  });

  it('Pro seçmek planı değiştirmez, ödeme penceresini açar', async () => {
    const fixture = TestBed.createComponent(PricingComponent);
    await fixture.componentInstance.selectPlan('pro');
    expect(fixture.componentInstance.showUpgradeModal).toBe(true);
    expect(userService.updateUserProfile).not.toHaveBeenCalled();
  });

  it('canlı sürümde ödeme penceresi ödemesiz "test modunda aktif et" seçeneği sunmamalı', () => {
    const fixture = TestBed.createComponent(PricingComponent);
    const lang = TestBed.inject(LanguageService);
    fixture.componentInstance.targetPlanId = 'pro';
    fixture.componentInstance.showUpgradeModal = true;
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain(lang.t('pricing.testActivate'));
  });

  it('ücretsiz plan reklamlı, ücretli planlar reklamsız olarak belirtilir', () => {
    const fixture = TestBed.createComponent(PricingComponent);
    const lang = TestBed.inject(LanguageService);
    const [free, pro, ent] = fixture.componentInstance.plans;
    expect(free.features).toContain(lang.t('pricing.f.withAds'));
    expect(pro.features).toContain(lang.t('pricing.f.adFree'));
    expect(ent.features).toContain(lang.t('pricing.f.adFree'));
  });

  it('ödeme penceresinde reklam alanı yok', () => {
    const fixture = TestBed.createComponent(PricingComponent);
    fixture.componentInstance.targetPlanId = 'pro';
    fixture.componentInstance.showUpgradeModal = true;
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-ad-slot, ins.adsbygoogle')).toBeNull();
  });
});
