import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile } from '../../core/models/user.model';
import { LanguageService } from '../../core/services/language.service';
import { AlertService } from '../../core/services/alert.service';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { LegalModalComponent } from '../../shared/components/legal-modal/legal-modal.component';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';
import { BUSINESS, PAYMENTS } from '../../core/constants/business.constant';
import { PaymentService } from '../../core/services/payment.service';
import { FREE_CUSTOMER_LIMIT, FREE_INVOICE_LIMIT } from '../../core/utils/plan-limits';

@Component({
    selector: 'app-pricing',
    standalone: true,
    imports: [CommonModule, RouterModule, LanguageSwitcherComponent, LegalModalComponent, SiteFooterComponent],
    templateUrl: './pricing.component.html',
    styles: [`:host { display: block; }`]
})
export class PricingComponent implements OnInit {
    private userService = inject(UserService);
    private authService = inject(AuthService);
    private alertService = inject(AlertService);
    private paymentService = inject(PaymentService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    lang = inject(LanguageService);

    userProfile: UserProfile | null = null;
    currentPlan: 'free' | 'pro' | 'enterprise' = 'free';
    isUpdating = false;
    showUpgradeModal = false;
    showLegalModal = false;
    readonly hasWhatsApp = !!BUSINESS.salesWhatsApp;
    readonly paymentsEnabled = PAYMENTS.enabled;

    get isLoggedIn(): boolean {
        return !!this.authService.currentUser;
    }
    targetPlanId: 'free' | 'pro' | 'enterprise' | null = null;

    private readonly planDefs = [
        {
            id: 'free',
            key: 'free',
            price: '₺0',
            features: ['pricing.f.free5', 'pricing.f.pdf', 'pricing.f.basicReports', 'pricing.f.emailSupport', 'pricing.f.withAds'],
            notIncluded: ['pricing.f.proforma', 'pricing.f.logo', 'pricing.f.csv', 'pricing.f.multiUser'],
            color: 'border-slate-200 dark:border-slate-800',
            btnClass: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200'
        },
        {
            id: 'pro',
            key: 'pro',
            price: '₺299',
            features: ['pricing.f.adFree', 'pricing.f.unlimitedInvoices', 'pricing.f.proformaSales', 'pricing.f.logoBank', 'pricing.f.csvReports', 'pricing.f.darkMode', 'pricing.f.prioritySupport'],
            notIncluded: ['pricing.f.multiUserAccount'],
            color: 'border-primary shadow-xl shadow-primary/15 relative',
            btnClass: 'bg-primary text-white hover:bg-blue-700 shadow-lg shadow-primary/30'
        },
        {
            id: 'enterprise',
            key: 'ent',
            price: '₺799',
            features: ['pricing.f.adFree', 'pricing.f.unlimitedAll', 'pricing.f.roles', 'pricing.f.reminders', 'pricing.f.api', 'pricing.f.accountManager', 'pricing.f.phoneSupport'],
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
        // iyzico ödeme dönüşü: /pricing?payment=success|failed
        const payment = this.route.snapshot.queryParamMap.get('payment');
        if (payment === 'success') {
            this.alertService.success(this.lang.t('pricing.paymentSuccessTitle'), this.lang.t('pricing.paymentSuccess'));
        } else if (payment === 'failed') {
            this.alertService.error(this.lang.t('pricing.paymentFailedTitle'), this.lang.t('pricing.paymentFailed'));
        }
        if (payment) {
            this.router.navigate([], { queryParams: {}, replaceUrl: true });
        }

        this.authService.user$.subscribe(async user => {
            if (user) {
                const profile = await this.userService.getUserProfile(user.uid);
                if (profile) {
                    this.userProfile = profile;
                    this.currentPlan = profile.plan || 'free';
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

    // Sadece ücretsiz plana dönüş istemciden yapılır; ücretli planlar ödeme doğrulandıktan sonra sunucuda açılır.
    async applyPlanChange(planId: 'free') {
        const currentUser = this.authService.currentUser;
        if (!currentUser) return;

        this.isUpdating = true;
        this.alertService.loading(this.lang.t('pricing.updating'));
        try {
            await this.userService.updateUserProfile(currentUser.uid, {
                plan: 'free',
                monthlyInvoiceLimit: FREE_INVOICE_LIMIT,
                customerLimit: FREE_CUSTOMER_LIMIT
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

    async startIyzicoPayment(): Promise<void> {
        const currentUser = this.authService.currentUser;
        if (!currentUser || !this.targetPlanId || this.targetPlanId === 'free') return;

        this.isUpdating = true;
        this.alertService.loading(this.lang.t('pricing.preparingPayment'));
        try {
            const checkout = await this.paymentService.initializeCheckoutForm(this.targetPlanId);
            window.location.assign(checkout.paymentPageUrl);
        } catch (error) {
            console.error('iyzico ödeme başlatma hatası:', error);
            this.alertService.error(this.lang.t('pricing.paymentStartFailedTitle'), this.lang.t('pricing.paymentStartFailed'));
        } finally {
            this.isUpdating = false;
        }
    }

    contactViaWhatsApp() {
        if (!this.targetPlan) return;
        const msg = encodeURIComponent(this.lang.t('pricing.waMessage', { plan: this.targetPlan.name, price: this.targetPlan.price }));
        window.open(`https://wa.me/${BUSINESS.salesWhatsApp}?text=${msg}`, '_blank');
    }

    contactViaEmail() {
        if (!this.targetPlan) return;
        const subject = encodeURIComponent(this.lang.t('pricing.mailSubject', { plan: this.targetPlan.name }));
        const body = encodeURIComponent(this.lang.t('pricing.mailBody', { plan: this.targetPlan.name, email: this.authService.currentUser?.email || '' }));
        window.location.href = `mailto:${BUSINESS.supportEmail}?subject=${subject}&body=${body}`;
    }
}
