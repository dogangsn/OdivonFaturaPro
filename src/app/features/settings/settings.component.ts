import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { LanguageService } from '../../core/services/language.service';
import { UserProfile } from '../../core/models/user.model';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './settings.component.html',
    styles: [`:host { display: block; }`]
})
export class SettingsComponent implements OnInit {
    private authService = inject(AuthService);
    private userService = inject(UserService);
    private platformId = inject(PLATFORM_ID);
    lang = inject(LanguageService);

    isSaving = false;
    successMessage = '';
    errorMessage = '';

    profileForm: Partial<UserProfile> = {
        companyName: '',
        companyAddress: '',
        taxOffice: '',
        taxId: '',
        phone: '',
        bankName: '',
        iban: '',
        logoUrl: '',
        displayName: '',
        email: ''
    };

    ngOnInit(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.loadUserProfile();
        }
    }

    private loadUserProfile(): void {
        this.authService.userProfile$.subscribe(profile => {
            if (profile) {
                this.profileForm = {
                    companyName: profile.companyName || '',
                    companyAddress: profile.companyAddress || '',
                    taxOffice: profile.taxOffice || '',
                    taxId: profile.taxId || '',
                    phone: profile.phone || profile.phoneNumber || '',
                    bankName: profile.bankName || '',
                    iban: profile.iban || '',
                    logoUrl: profile.logoUrl || '',
                    displayName: profile.displayName || '',
                    email: profile.email || ''
                };
            }
        });
    }

    async saveSettings(): Promise<void> {
        const currentUser = this.authService.currentUser;
        if (!currentUser) {
            this.errorMessage = this.lang.t('settings.errNotLoggedIn');
            return;
        }

        this.isSaving = true;
        this.successMessage = '';
        this.errorMessage = '';

        try {
            await this.userService.updateUserProfile(currentUser.uid, this.profileForm);
            
            // Local memory & localStorage cache update
            const updatedProfile: UserProfile = {
                ...this.authService.userProfile!,
                ...this.profileForm
            } as UserProfile;
            
            this.authService.updateCachedProfile(updatedProfile);

            this.successMessage = this.lang.t('settings.saveSuccess');
            setTimeout(() => this.successMessage = '', 4000);
        } catch (error: any) {
            console.error('Ayarlar kaydedilirken hata:', error);
            this.errorMessage = this.lang.t('settings.errSave');
        } finally {
            this.isSaving = false;
        }
    }
}
