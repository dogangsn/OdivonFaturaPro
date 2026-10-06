import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdSlotComponent, ADSENSE_CONFIG } from './ad-slot.component';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';

describe('AdSlotComponent — ücretsiz plan reklamı', () => {
  async function render(opts: { plan?: string | null; loggedIn?: boolean; clientId?: string }) {
    const { plan = 'free', loggedIn = true, clientId = 'ca-pub-test' } = opts;
    TestBed.configureTestingModule({
      imports: [AdSlotComponent],
      providers: [
        provideRouter([]),
        { provide: ADSENSE_CONFIG, useValue: { clientId, slotId: clientId ? '123' : '' } },
        { provide: AuthService, useValue: { currentUser: loggedIn ? { uid: 'u1' } : null } },
        { provide: UserService, useValue: { getUserProfile: vi.fn().mockResolvedValue(plan === null ? null : { uid: 'u1', plan }) } },
      ],
    });
    const fixture = TestBed.createComponent(AdSlotComponent);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  afterEach(() => document.getElementById('adsbygoogle-js')?.remove());

  it('ücretsiz plandaki kullanıcıya reklam gösterir ve AdSense betiğini yükler', async () => {
    const el = await render({ plan: 'free' });
    expect(el.querySelector('ins.adsbygoogle')?.getAttribute('data-ad-client')).toBe('ca-pub-test');
    expect(document.getElementById('adsbygoogle-js')?.getAttribute('src')).toContain('client=ca-pub-test');
  });

  it('Pro kullanıcıya reklam göstermez', async () => {
    const el = await render({ plan: 'pro' });
    expect(el.querySelector('ins.adsbygoogle')).toBeNull();
    expect(document.getElementById('adsbygoogle-js')).toBeNull();
  });

  it('Kurumsal kullanıcıya reklam göstermez', async () => {
    expect((await render({ plan: 'enterprise' })).querySelector('ins.adsbygoogle')).toBeNull();
  });

  it('girişsiz kullanıcıya reklam göstermez', async () => {
    expect((await render({ loggedIn: false })).querySelector('ins.adsbygoogle')).toBeNull();
  });

  it('AdSense kimliği tanımlı değilse hiçbir şey yüklemez', async () => {
    const el = await render({ clientId: '' });
    expect(el.querySelector('ins.adsbygoogle')).toBeNull();
    expect(document.getElementById('adsbygoogle-js')).toBeNull();
  });
});
