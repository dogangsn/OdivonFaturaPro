import { AfterViewChecked, Component, inject, InjectionToken, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { LanguageService } from '../../../core/services/language.service';
import { ADSENSE } from '../../../core/constants/business.constant';
import { isFreePlan } from '../../../core/utils/plan-limits';

const ADSENSE_SCRIPT_ID = 'adsbygoogle-js';

export const ADSENSE_CONFIG = new InjectionToken<{ clientId: string; slotId: string }>('ADSENSE_CONFIG', {
    providedIn: 'root',
    factory: () => ADSENSE
});

/**
 * Ücretsiz plandaki kullanıcılara Google AdSense reklamı gösterir.
 * Ücretli planlarda, girişsiz kullanıcıda veya AdSense kimliği tanımlı değilse hiçbir şey göstermez.
 * Fiyatlandırma/abonelik ekranlarına eklenmez.
 */
@Component({
    selector: 'app-ad-slot',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <aside *ngIf="visible" class="mx-auto w-full max-w-5xl px-4 py-3" [attr.aria-label]="lang.t('ads.label')">
        <div class="flex items-center justify-between mb-1 text-[10px] uppercase tracking-wider text-slate-400">
            <span>{{ lang.t('ads.label') }}</span>
            <a routerLink="/pricing" class="normal-case tracking-normal text-primary hover:underline">{{ lang.t('ads.removeCta') }}</a>
        </div>
        <ins class="adsbygoogle block"
            style="display:block"
            [attr.data-ad-client]="clientId"
            [attr.data-ad-slot]="slotId"
            data-ad-format="auto"
            data-full-width-responsive="true"></ins>
    </aside>
    `,
    styles: [`:host { display: block; }`]
})
export class AdSlotComponent implements OnInit, AfterViewChecked {
    private authService = inject(AuthService);
    private userService = inject(UserService);
    private platformId = inject(PLATFORM_ID);
    private document = inject(DOCUMENT);
    lang = inject(LanguageService);

    private config = inject(ADSENSE_CONFIG);
    readonly clientId = this.config.clientId;
    readonly slotId = this.config.slotId;
    visible = false;
    private pushed = false;

    async ngOnInit(): Promise<void> {
        if (!isPlatformBrowser(this.platformId) || !this.clientId || !this.slotId) return;

        const user = this.authService.currentUser;
        if (!user) return;

        // Planı her seferinde Firestore'dan oku: yükseltme yapan kullanıcı eski önbellek yüzünden reklam görmesin.
        const profile = await this.userService.getUserProfile(user.uid);
        if (!profile || !isFreePlan(profile)) return;

        this.loadScript();
        this.visible = true;
    }

    ngAfterViewChecked(): void {
        if (!this.visible || this.pushed) return;
        this.pushed = true;
        try {
            const w = this.document.defaultView as any;
            (w.adsbygoogle = w.adsbygoogle || []).push({});
        } catch (error) {
            console.error('AdSense yüklenemedi:', error);
        }
    }

    private loadScript(): void {
        if (this.document.getElementById(ADSENSE_SCRIPT_ID)) return;
        const script = this.document.createElement('script');
        script.id = ADSENSE_SCRIPT_ID;
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.clientId}`;
        this.document.head.appendChild(script);
    }
}
