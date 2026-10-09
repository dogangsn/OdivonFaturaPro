import { TestBed } from '@angular/core/testing';
import { COOKIE_CONSENT_KEY, COOKIE_CONSENT_VERSION, CookieConsentService } from './cookie-consent.service';

describe('CookieConsentService — çerez onayı', () => {
  const create = () => {
    TestBed.resetTestingModule();
    return TestBed.inject(CookieConsentService);
  };

  beforeEach(() => localStorage.removeItem(COOKIE_CONSENT_KEY));
  afterEach(() => localStorage.removeItem(COOKIE_CONSENT_KEY));

  it('karar yokken bandı açar ve reklam çerezine izin vermez', () => {
    const consent = create();
    expect(consent.bannerOpen()).toBe(true);
    expect(consent.adsAllowed()).toBe(false);
  });

  it('kabul kalıcıdır, bir sonraki ziyarette bant çıkmaz', () => {
    create().acceptAll();
    const next = create();
    expect(next.bannerOpen()).toBe(false);
    expect(next.adsAllowed()).toBe(true);
  });

  it('ret kalıcıdır ve reklam çerezine izin vermez', () => {
    create().rejectAll();
    const next = create();
    expect(next.bannerOpen()).toBe(false);
    expect(next.adsAllowed()).toBe(false);
  });

  it('12 aydan eski veya eski sürümlü karar yeniden sorulur', () => {
    const old = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ ads: true, decidedAt: old, version: COOKIE_CONSENT_VERSION }));
    expect(create().bannerOpen()).toBe(true);

    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ ads: true, decidedAt: new Date().toISOString(), version: 0 }));
    expect(create().adsAllowed()).toBe(false);
  });

  it('tercihler alt bilgiden yeniden açılabilir', () => {
    const consent = create();
    consent.rejectAll();
    consent.openPreferences();
    expect(consent.bannerOpen()).toBe(true);
  });
});
