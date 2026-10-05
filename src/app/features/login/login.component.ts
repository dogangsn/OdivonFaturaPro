import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { LegalModalComponent, LegalDocType } from '../../shared/components/legal-modal/legal-modal.component';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, LegalModalComponent, LanguageSwitcherComponent],
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

    ngOnInit() {
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        if (this.route.snapshot.queryParams['mode'] === 'register') {
            this.isRegisterMode = true;
        }
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
            await this.authService.loginWithEmail(this.email.trim(), this.password);
            this.router.navigate([this.returnUrl]);
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
            this.router.navigate([this.returnUrl]);
        } catch (error: any) {
            console.error('Register error:', error);
            this.errorMessage = this.getErrorMessage(error.code);
        } finally {
            this.isLoading = false;
        }
    }

    async loginWithGoogle() {
        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';
        try {
            const user = await this.authService.loginWithGoogle();
            if (user) {
                console.log('Google ile giriş başarılı:', user.displayName);
                this.router.navigate([this.returnUrl]);
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

