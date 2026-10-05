import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile } from '../../core/models/user.model';
import { LanguageService } from '../../core/services/language.service';
import { AlertService } from '../../core/services/alert.service';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';

@Component({
    selector: 'app-pricing',
    standalone: true,
    imports: [CommonModule, RouterModule, LanguageSwitcherComponent],
    templateUrl: './pricing.component.html',
    styles: [`:host { display: block; }`]
})
export class PricingComponent implements OnInit {
    private userService = inject(UserService);
    private authService = inject(AuthService);
    private alertService = inject(AlertService);
    lang = inject(LanguageService);

    userProfile: UserProfile | null = null;
    currentPlan: 'free' | 'pro' | 'enterprise' = 'free';
    isUpdating = false;
    showUpgradeModal = false;

    get isLoggedIn(): boolean {
        return !!this.authService.currentUser;
    }
    targetPlanId: 'free' | 'pro' | 'enterprise' | null = null;

    private readonly planDefs = [
        {
            id: 'free',
            key: 'free',
            price: '₺0',
            features: ['pricing.f.free5', 'pricing.f.pdf', 'pricing.f.basicReports', 'pricing.f.emailSupport'],
            notIncluded: ['pricing.f.proforma', 'pricing.f.logo', 'pricing.f.csv', 'pricing.f.multiUser'],
            color: 'border-slate-200 dark:border-slate-800',
            btnClass: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200'
        },
        {
            id: 'pro',
            key: 'pro',
            price: '₺299',
            features: ['pricing.f.unlimitedInvoices', 'pricing.f.proformaSales', 'pricing.f.logoBank', 'pricing.f.csvReports', 'pricing.f.darkMode', 'pricing.f.prioritySupport'],
            notIncluded: ['pricing.f.multiUserAccount'],
            color: 'border-primary shadow-xl shadow-primary/15 relative',
            btnClass: 'bg-primary text-white hover:bg-blue-700 shadow-lg shadow-primary/30'
        },
        {
            id: 'enterprise',
            key: 'ent',
            price: '₺799',
            features: ['pricing.f.unlimitedAll', 'pricing.f.roles', 'pricing.f.reminders', 'pricing.f.api', 'pricing.f.accountManager', 'pricing.f.phoneSupport'],
            notIncluded: [] as string[],
            color: 'border-purple-500 dark:border-purple-800 shadow-xl shadow-purple-500/10',
            btnClass: 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-600/30'
        }
    ];

    get plans() {
        return this.lang.cached('pricing.plans', () => this.planDefs.map(p => ({
            id: p.id,
            name: this.lang.t(`pricing.${p.key}Name`),
            badge: this.lang.t(`pricing.${p.key}Badge`),
            price: p.price,
            period: this.lang.t('pricing.perMonthly'),
            description: this.lang.t(`pricing.${p.key}Desc`),
            features: p.features.map(f => this.lang.t(f)),
            notIncluded: p.notIncluded.map(f => this.lang.t(f)),
            color: p.color,
            btnClass: p.btnClass
        })));
    }

    get targetPlan() {
        return this.plans.find(p => p.id === this.targetPlanId) || null;
    }

    ngOnInit() {
        this.authService.user$.subscribe(async user => {
            if (user) {
                const profile = await this.userService.getUserProfile(user.uid);
                if (profile) {
                    this.userProfile = profile;
                    this.currentPlan = profile.plan || 'pro';
                }
            }
        });
    }

    async selectPlan(planId: 'free' | 'pro' | 'enterprise') {
        if (this.currentPlan === planId) return;

        const currentUser = this.authService.currentUser;
        if (!currentUser) {
            this.alertService.warning(this.lang.t('pricing.loginRequiredTitle'), this.lang.t('pricing.loginRequired'));
            return;
        }

        if (planId === 'free') {
            const confirmed = await this.alertService.confirm(
                this.lang.t('pricing.toFreeTitle'),
                this.lang.t('pricing.toFreeText'),
                this.lang.t('pricing.toFreeConfirm'),
                this.lang.t('alert.cancel')
            );
            if (!confirmed) return;
            await this.applyPlanChange(planId);
        } else {
            // Pro veya Kurumsal Plan için ödeme ve yükseltme modalını aç
            this.targetPlanId = planId;
            this.showUpgradeModal = true;
        }
    }

    async applyPlanChange(planId: 'free' | 'pro' | 'enterprise') {
        const currentUser = this.authService.currentUser;
        if (!currentUser) return;

        this.isUpdating = true;
        this.alertService.loading(this.lang.t('pricing.updating'));
        try {
            await this.userService.updateUserProfile(currentUser.uid, {
                plan: planId,
                monthlyInvoiceLimit: planId === 'free' ? 5 : 999999
            });
            this.currentPlan = planId;
            this.showUpgradeModal = false;
            await this.alertService.success(this.lang.t('pricing.successTitle'), this.lang.t('pricing.successText', { plan: planId.toUpperCase() }));
        } catch (error) {
            console.error('Failed to change plan:', error);
            this.alertService.error(this.lang.t('common.error'), this.lang.t('pricing.updateError'));
        } finally {
            this.isUpdating = false;
        }
    }

    contactViaWhatsApp() {
        if (!this.targetPlan) return;
        const msg = encodeURIComponent(this.lang.t('pricing.waMessage', { plan: this.targetPlan.name, price: this.targetPlan.price }));
        window.open(`https://wa.me/905000000000?text=${msg}`, '_blank');
    }

    contactViaEmail() {
        if (!this.targetPlan) return;
        const subject = encodeURIComponent(this.lang.t('pricing.mailSubject', { plan: this.targetPlan.name }));
        const body = encodeURIComponent(this.lang.t('pricing.mailBody', { plan: this.targetPlan.name, email: this.authService.currentUser?.email || '' }));
        window.location.href = `mailto:destek@odivon.com?subject=${subject}&body=${body}`;
    }
}
