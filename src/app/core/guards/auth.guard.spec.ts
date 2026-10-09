import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  async function run(opts: { signedIn: boolean; accepted?: boolean }) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: Auth, useValue: { authStateReady: () => Promise.resolve(), currentUser: opts.signedIn ? { uid: 'u1' } : null } },
        { provide: AuthService, useValue: { hasAcceptedTerms: vi.fn().mockResolvedValue(opts.accepted ?? true) } },
      ],
    });
    const result = await TestBed.runInInjectionContext(() => authGuard({} as any, { url: '/invoices' } as any));
    const router = TestBed.inject(Router);
    return result instanceof UrlTree ? router.serializeUrl(result) : result;
  }

  it('girişsiz kullanıcıyı giriş sayfasına gönderir', async () => {
    expect(await run({ signedIn: false })).toBe('/login?returnUrl=%2Finvoices');
  });

  it('şartları onaylamamış kullanıcıyı onay adımına gönderir', async () => {
    expect(await run({ signedIn: true, accepted: false })).toBe('/login?returnUrl=%2Finvoices&consent=1');
  });

  it('onaylı kullanıcıyı geçirir', async () => {
    expect(await run({ signedIn: true, accepted: true })).toBe(true);
  });
});
