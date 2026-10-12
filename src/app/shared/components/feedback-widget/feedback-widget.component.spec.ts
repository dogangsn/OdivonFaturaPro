import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FeedbackWidgetComponent } from './feedback-widget.component';
import { AuthService } from '../../../core/services/auth.service';
import { CookieConsentService } from '../../../core/services/cookie-consent.service';
import { FeedbackService } from '../../../core/services/feedback.service';

describe('FeedbackWidgetComponent — sağ alt geri bildirim butonu', () => {
  async function render(opts: { bannerOpen?: boolean; send?: () => Promise<void> } = {}) {
    const { bannerOpen = false, send = () => Promise.resolve() } = opts;
    localStorage.removeItem('cookieConsent');
    const sendSpy = vi.fn(send);
    TestBed.configureTestingModule({
      imports: [FeedbackWidgetComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { currentUser: { uid: 'u1', email: 'uye@example.com' } } },
        { provide: FeedbackService, useValue: { send: sendSpy } },
      ],
    });
    if (!bannerOpen) TestBed.inject(CookieConsentService).save(false, false);
    const fixture = TestBed.createComponent(FeedbackWidgetComponent);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, sendSpy };
  }

  afterEach(() => localStorage.removeItem('cookieConsent'));

  it('butona basınca formu açar ve giriş yapmış kullanıcının e-postasını doldurur', async () => {
    const { fixture, el } = await render();
    expect(el.querySelector('#feedback-panel')).toBeNull();
    (el.querySelector('button[aria-controls="feedback-panel"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('#feedback-panel')).not.toBeNull();
    expect(fixture.componentInstance.email).toBe('uye@example.com');
  });

  it('mesajı gönderir ve teşekkür ekranını gösterir', async () => {
    const { fixture, el, sendSpy } = await render();
    const widget = fixture.componentInstance;
    widget.toggle();
    widget.message = 'Daha fazla para birimi';
    await widget.submit();
    fixture.detectChanges();
    expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({ message: 'Daha fazla para birimi', email: 'uye@example.com' }));
    expect(widget.state()).toBe('sent');
    expect(el.querySelector('[role="status"]')).not.toBeNull();
  });

  it('boş mesaj ve bot tuzağı doldurulmuş form gönderilmez', async () => {
    const { fixture, sendSpy } = await render();
    const widget = fixture.componentInstance;
    await widget.submit();
    widget.message = 'spam';
    widget.website = 'http://spam.example';
    await widget.submit();
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it('gönderim hatasında hata mesajı gösterir', async () => {
    const { fixture } = await render({ send: () => Promise.reject(new Error('permission-denied')) });
    const widget = fixture.componentInstance;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    widget.message = 'Merhaba';
    await widget.submit();
    expect(widget.state()).toBe('error');
  });

  it('çerez bandı açıkken gizlenir', async () => {
    const { el } = await render({ bannerOpen: true });
    expect(el.querySelector('button[aria-controls="feedback-panel"]')).toBeNull();
  });
});
