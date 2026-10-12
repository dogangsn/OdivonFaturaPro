import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LanguageService } from '../../../core/services/language.service';
import { AuthService } from '../../../core/services/auth.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { CookieConsentService } from '../../../core/services/cookie-consent.service';
import { FEEDBACK_MAX_LENGTH, FeedbackService } from '../../../core/services/feedback.service';

type FeedbackState = 'idle' | 'sending' | 'sent' | 'error';

/**
 * Sağ alt köşedeki yuvarlak buton; açılan küçük formla ziyaretçi geri bildirimini info@odivon.com'a iletir.
 * Çerez bandı açıkken gizlenir, ikisi üst üste binmesin.
 */
@Component({
    selector: 'app-feedback-widget',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div *ngIf="!consent.bannerOpen()" class="fixed bottom-5 end-5 z-50 flex flex-col items-end gap-3">
        <div *ngIf="open()" id="feedback-panel" role="dialog" aria-modal="false" aria-labelledby="feedback-title"
            class="w-[min(22rem,calc(100vw-2.5rem))] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-5 text-slate-700 dark:text-slate-200">
            <div class="flex items-start justify-between gap-3">
                <h2 id="feedback-title" class="font-bold text-slate-900 dark:text-white">{{ lang.t('feedback.title') }}</h2>
                <button type="button" (click)="close()" [attr.aria-label]="lang.t('feedback.close')"
                    class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <span class="material-symbols-outlined text-xl" aria-hidden="true">close</span>
                </button>
            </div>

            <ng-container *ngIf="state() !== 'sent'; else sentTpl">
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ lang.t('feedback.text') }}</p>
                <form class="mt-4 space-y-3" (ngSubmit)="submit()">
                    <label class="block">
                        <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">{{ lang.t('feedback.message') }}</span>
                        <textarea name="feedbackMessage" [(ngModel)]="message" required rows="4" [maxlength]="maxLength"
                            [placeholder]="lang.t('feedback.messagePlaceholder')"
                            class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:border-primary focus:ring-primary"></textarea>
                    </label>
                    <label class="block">
                        <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">{{ lang.t('feedback.email') }}</span>
                        <input name="feedbackEmail" type="email" [(ngModel)]="email" maxlength="200" autocomplete="email"
                            [placeholder]="lang.t('feedback.emailPlaceholder')"
                            class="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:border-primary focus:ring-primary">
                    </label>
                    <!-- Bot tuzağı: gerçek kullanıcı bu alanı görmez -->
                    <input name="website" [(ngModel)]="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="hidden">
                    <p *ngIf="state() === 'error'" class="text-xs text-red-600" role="alert">{{ lang.t('feedback.error') }}</p>
                    <button type="submit" [disabled]="!canSend()"
                        class="w-full px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        {{ lang.t(state() === 'sending' ? 'feedback.sending' : 'feedback.send') }}
                    </button>
                </form>
            </ng-container>
            <ng-template #sentTpl>
                <div class="mt-4 text-center" role="status">
                    <span class="material-symbols-outlined text-4xl text-emerald-500" aria-hidden="true">check_circle</span>
                    <p class="mt-2 font-semibold text-slate-900 dark:text-white">{{ lang.t('feedback.thanks') }}</p>
                    <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ lang.t('feedback.thanksText') }}</p>
                </div>
            </ng-template>
        </div>

        <button type="button" (click)="toggle()" [attr.aria-expanded]="open()" aria-controls="feedback-panel"
            [attr.aria-label]="lang.t('feedback.button')" [title]="lang.t('feedback.button')"
            class="w-14 h-14 rounded-full bg-primary text-white shadow-xl hover:bg-blue-700 hover:scale-105 transition flex items-center justify-center">
            <span class="material-symbols-outlined text-2xl" aria-hidden="true">{{ open() ? 'close' : 'chat' }}</span>
        </button>
    </div>
    `
})
export class FeedbackWidgetComponent {
    lang = inject(LanguageService);
    consent = inject(CookieConsentService);
    private auth = inject(AuthService);
    private feedback = inject(FeedbackService);
    private analytics = inject(AnalyticsService);
    private router = inject(Router);

    readonly maxLength = FEEDBACK_MAX_LENGTH;
    readonly open = signal(false);
    readonly state = signal<FeedbackState>('idle');
    message = '';
    email = '';
    website = '';

    toggle(): void {
        if (this.open()) {
            this.close();
            return;
        }
        if (this.state() === 'sent') this.state.set('idle');
        if (!this.email) this.email = this.auth.currentUser?.email ?? '';
        this.open.set(true);
    }

    close(): void {
        this.open.set(false);
    }

    canSend(): boolean {
        return this.state() !== 'sending' && this.message.trim().length > 0;
    }

    async submit(): Promise<void> {
        if (!this.canSend()) return;
        // Bot doldurduysa gönderilmiş gibi davran.
        if (this.website) {
            this.state.set('sent');
            return;
        }
        this.state.set('sending');
        try {
            await this.feedback.send({
                message: this.message,
                email: this.email,
                lang: this.lang.lang,
                page: this.router.url.slice(0, 200),
            });
            this.analytics.event('send_feedback');
            this.message = '';
            this.state.set('sent');
        } catch (err) {
            console.error('Geri bildirim gönderilemedi', err);
            this.state.set('error');
        }
    }
}
