import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';

describe('LoginComponent — kullanım şartları onayı', () => {
  let auth: {
    currentUser: unknown;
    loginWithGoogle: ReturnType<typeof vi.fn>;
    loginWithEmail: ReturnType<typeof vi.fn>;
    acceptTerms: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let navigateByUrl: ReturnType<typeof vi.fn>;

  function create(queryParams: Record<string, string> = {}) {
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams } } },
      ],
    });
    navigateByUrl = vi.fn().mockResolvedValue(true);
    TestBed.inject(Router).navigateByUrl = navigateByUrl as any;
    // Varsayılan dil tarayıcıdan gelir; metin kontrolleri Türkçe.
    TestBed.inject(LanguageService).currentLang.set('tr');
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    auth = {
      currentUser: { uid: 'u1' },
      loginWithGoogle: vi.fn().mockResolvedValue({ user: { uid: 'u1' }, needsTerms: false }),
      loginWithEmail: vi.fn().mockResolvedValue({ user: { uid: 'u1' }, needsTerms: false }),
      acceptTerms: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('Google ile ilk girişte şartlar onaylanmadan panele geçmez', async () => {
    auth.loginWithGoogle.mockResolvedValue({ user: { uid: 'u1' }, needsTerms: true });
    const fixture = create();
    await fixture.componentInstance.loginWithGoogle();
    fixture.detectChanges();

    expect(auth.loginWithGoogle).toHaveBeenCalledWith(false);
    expect(fixture.componentInstance.pendingTerms).toBe(true);
    expect(navigateByUrl).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Kabul et ve devam et');
  });

  it('onay kutusu işaretlenip kabul edilince onayı kaydeder ve devam eder', async () => {
    const fixture = create({ consent: '1', returnUrl: '/invoices' });
    const c = fixture.componentInstance;
    expect(c.pendingTerms).toBe(true);

    await c.acceptPendingTerms();
    expect(auth.acceptTerms).not.toHaveBeenCalled();

    c.pendingTermsChecked = true;
    await c.acceptPendingTerms();
    expect(auth.acceptTerms).toHaveBeenCalled();
    expect(navigateByUrl).toHaveBeenCalledWith('/invoices');
  });

  it('onayı reddeden kullanıcının oturumu kapatılır', async () => {
    const fixture = create({ consent: '1' });
    await fixture.componentInstance.declinePendingTerms();
    expect(auth.logout).toHaveBeenCalled();
  });

  it('kayıt sekmesinde onay kutusu işaretlenmeden Google ile kayıt başlamaz', async () => {
    const fixture = create({ mode: 'register' });
    await fixture.componentInstance.loginWithGoogle();
    expect(auth.loginWithGoogle).not.toHaveBeenCalled();

    fixture.componentInstance.acceptTerms = true;
    await fixture.componentInstance.loginWithGoogle();
    expect(auth.loginWithGoogle).toHaveBeenCalledWith(true);
  });

  it('sorgu parametreli dönüş adresini bozmadan açar, dış adrese yönlendirmez', async () => {
    let fixture = create({ returnUrl: '/invoices?status=paid' });
    fixture.componentInstance.email = 'a@b.co';
    fixture.componentInstance.password = 'secret1';
    await fixture.componentInstance.login();
    expect(navigateByUrl).toHaveBeenCalledWith('/invoices?status=paid');

    TestBed.resetTestingModule();
    fixture = create({ returnUrl: '//evil.example' });
    expect(fixture.componentInstance.returnUrl).toBe('/dashboard');
  });
});
