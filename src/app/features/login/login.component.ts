import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { LegalModalComponent, LegalDocType } from '../../shared/components/legal-modal/legal-modal.component';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, LegalModalComponent, LanguageSwitcherComponent, SiteFooterComponent],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private authService = inject(AuthService);
    lang = inject(LanguageService);

    isRegisterMode = false;
    displayName = '';
    email = '';
    password = '';
    confirmPassword = '';
    acceptTerms = false;
    returnUrl = '/dashboard';
    isLoading = false;
    errorMessage = '';
    successMessage = '';

    // Legal modal
    showLegalModal = false;
    legalModalTab: LegalDocType = 'terms';

    /** Girişli ama kullanım şartlarını henüz onaylamamış kullanıcıya onay adımı gösterilir. */
    pendingTerms = false;
    pendingTermsChecked = false;

    ngOnInit() {
        this.returnUrl = this.safeReturnUrl(this.route.snapshot.queryParams['returnUrl']);
        if (this.route.snapshot.queryParams['mode'] === 'register') {
            this.isRegisterMode = true;
        }
        // authGuard şartları onaylanmamış kullanıcıyı buraya gönderir.
        if (this.route.snapshot.queryParams['consent'] && this.authService.currentUser) {
            this.pendingTerms = true;
        }
    }

    /** Yalnızca uygulama içi adreslere dön (dış siteye yönlendirme yok); sorgu parametreleri korunur. */
    private safeReturnUrl(url: unknown): string {
        return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/login')
            ? url
            : '/dashboard';
    }

    private finishSignIn(needsTerms: boolean) {
        if (needsTerms) {
            this.pendingTerms = true;
            this.pendingTermsChecked = false;
            return;
        }
        this.router.navigateByUrl(this.returnUrl);
    }

    async acceptPendingTerms() {
        if (!this.pendingTermsChecked) {
            this.errorMessage = this.lang.t('auth.errAcceptTerms');
            return;
        }
        this.isLoading = true;
        this.errorMessage = '';
        try {
            await this.authService.acceptTerms();
            this.pendingTerms = false;
            this.router.navigateByUrl(this.returnUrl);
        } catch (error: any) {
            console.error('Accept terms error:', error);
            this.errorMessage = this.lang.t('common.errGeneric');
        } finally {
            this.isLoading = false;
        }
    }

    async declinePendingTerms() {
        this.pendingTerms = false;
        this.errorMessage = '';
        await this.authService.logout();
    }

    toggleMode(isRegister: boolean) {
        this.isRegisterMode = isRegister;
        this.errorMessage = '';
        this.successMessage = '';
    }

    openLegal(tab: LegalDocType) {
        this.legalModalTab = tab;
        this.showLegalModal = true;
    }

    async onSubmit() {
        if (this.isRegisterMode) {
            await this.register();
        } else {
            await this.login();
        }
    }

    async login() {
        if (!this.email || !this.password) {
            this.errorMessage = this.lang.t('auth.errEmailPassword');
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';
        try {
            const result = await this.authService.loginWithEmail(this.email.trim(), this.password);
            this.finishSignIn(result.needsTerms);
        } catch (error: any) {
            console.error('Login error:', error);
            this.errorMessage = this.getErrorMessage(error.code);
        } finally {
            this.isLoading = false;
        }
    }

    async register() {
        if (!this.displayName.trim() || !this.email.trim() || !this.password) {
            this.errorMessage = this.lang.t('auth.errFillAll');
            return;
        }

        if (this.password.length < 6) {
            this.errorMessage = this.lang.t('auth.errPasswordLength');
            return;
        }

        if (this.password !== this.confirmPassword) {
            this.errorMessage = this.lang.t('auth.errPasswordMismatch');
            return;
        }

        if (!this.acceptTerms) {
            this.errorMessage = this.lang.t('auth.errAcceptTerms');
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';
        try {
            await this.authService.registerWithEmail(this.email.trim(), this.password, this.displayName.trim());
            this.router.navigateByUrl(this.returnUrl);
        } catch (error: any) {
            console.error('Register error:', error);
            this.errorMessage = this.getErrorMessage(error.code);
        } finally {
            this.isLoading = false;
        }
    }

    async loginWithGoogle() {
        // Kayıt sekmesinde onay kutusu Google ile kayıt için de geçerlidir.
        if (this.isRegisterMode && !this.acceptTerms) {
            this.errorMessage = this.lang.t('auth.errAcceptTerms');
            return;
        }
        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';
        try {
            const result = await this.authService.loginWithGoogle(this.isRegisterMode && this.acceptTerms);
            if (result) {
                this.finishSignIn(result.needsTerms);
            }
        } catch (error: any) {
            console.error('Login failed', error);
            this.errorMessage = this.getErrorMessage(error.code);
        } finally {
            this.isLoading = false;
        }
    }

    async forgotPassword() {
        if (!this.email) {
            this.errorMessage = this.lang.t('auth.errResetEmail');
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';
        try {
            await this.authService.resetPassword(this.email.trim());
            this.successMessage = this.lang.t('auth.resetSent');
        } catch (error: any) {
            console.error('Reset password error:', error);
            this.errorMessage = this.getErrorMessage(error.code);
        } finally {
            this.isLoading = false;
        }
    }

    private getErrorMessage(errorCode: string): string {
        const errorMessages: { [key: string]: string } = {
            'auth/email-already-in-use': this.lang.t('auth.errEmailInUse'),
            'auth/weak-password': this.lang.t('auth.errWeakPassword'),
            'auth/user-not-found': this.lang.t('auth.errUserNotFound'),
            'auth/wrong-password': this.lang.t('auth.errWrongPassword'),
            'auth/invalid-email': this.lang.t('auth.errInvalidEmail'),
            'auth/user-disabled': this.lang.t('auth.errUserDisabled'),
            'auth/too-many-requests': this.lang.t('auth.errTooManyRequests'),
            'auth/popup-closed-by-user': this.lang.t('auth.errPopupClosed'),
            'auth/cancelled-popup-request': this.lang.t('auth.errPopupCancelled'),
            'auth/popup-blocked': this.lang.t('auth.errPopupBlocked'),
            'auth/invalid-credential': this.lang.t('auth.errInvalidCredential'),
            'auth/operation-not-allowed': this.lang.t('auth.errOperationNotAllowed'),
        };
        return errorMessages[errorCode] || this.lang.t('common.errGeneric');
    }
}

