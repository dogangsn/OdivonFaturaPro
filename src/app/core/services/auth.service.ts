import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { UserService } from './user.service';
import { UserProfile } from '../models/user.model';

const USER_PROFILE_CACHE_KEY = 'userProfile';

export interface SignInResult {
    user: User;
    /** Kullanıcı kullanım şartlarını henüz onaylamadı; panele geçmeden önce onay alınmalı. */
    needsTerms: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private auth: Auth = inject(Auth);
    private router: Router = inject(Router);
    private userService = inject(UserService);
    private platformId = inject(PLATFORM_ID);

    user$: Observable<User | null> = user(this.auth);
    
    private userProfileSubject = new BehaviorSubject<UserProfile | null>(null);
    userProfile$ = this.userProfileSubject.asObservable();

    get userProfile(): UserProfile | null {
        return this.userProfileSubject.value;
    }

    get currentUser(): User | null {
        return this.auth.currentUser;
    }

    constructor() {
        // Sayfa yüklendiğinde cache'den profili yükle
        this.loadCachedProfile();
        
        // Auth state değişikliklerini dinle
        this.user$.subscribe(async (firebaseUser) => {
            if (firebaseUser) {
                // Kullanıcı giriş yapmış, profili yükle (cache'de yoksa)
                if (!this.userProfile) {
                    await this.loadUserProfile();
                }
            } else {
                // Kullanıcı çıkış yapmış, cache'i temizle
                this.clearCachedProfile();
            }
        });
    }

    private loadCachedProfile(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        
        try {
            const cached = localStorage.getItem(USER_PROFILE_CACHE_KEY);
            if (cached) {
                const profile = JSON.parse(cached) as UserProfile;
                this.userProfileSubject.next(profile);
            }
        } catch (error) {
            console.error('Cache read error:', error);
            localStorage.removeItem(USER_PROFILE_CACHE_KEY);
        }
    }

    private cacheProfile(profile: UserProfile): void {
        if (!isPlatformBrowser(this.platformId)) return;
        
        try {
            localStorage.setItem(USER_PROFILE_CACHE_KEY, JSON.stringify(profile));
            this.userProfileSubject.next(profile);
        } catch (error) {
            console.error('Cache write error:', error);
        }
    }

    private clearCachedProfile(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        
        localStorage.removeItem(USER_PROFILE_CACHE_KEY);
        this.userProfileSubject.next(null);
    }

    /**
     * Google ile giriş. Hesabı olmayan kullanıcı için profil yalnızca şartlar onaylandıysa (acceptTerms) oluşturulur;
     * aksi hâlde needsTerms döner ve giriş ekranı onayı ister.
     */
    async loginWithGoogle(acceptTerms = false): Promise<SignInResult | null> {
        if (!isPlatformBrowser(this.platformId)) return null;
        
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        
        const result = await signInWithPopup(this.auth, provider);
        if (!result?.user) return null;

        if (!acceptTerms && !(await this.userService.getUserProfile(result.user.uid))) {
            return { user: result.user, needsTerms: true };
        }
        // Kullanıcıyı Firestore'a kaydet ve cache'le
        const profile = await this.userService.createOrUpdateUserProfile(result.user, { acceptTerms });
        this.cacheProfile(profile);
        return { user: result.user, needsTerms: !profile.termsAcceptedAt };
    }

    async loginWithEmail(email: string, password: string): Promise<SignInResult> {
        const result = await signInWithEmailAndPassword(this.auth, email, password);
        // Kullanıcıyı Firestore'a kaydet ve cache'le
        const profile = await this.userService.createOrUpdateUserProfile(result.user);
        this.cacheProfile(profile);
        return { user: result.user, needsTerms: !profile.termsAcceptedAt };
    }

    /** Kayıt formunda şartlar onay kutusu zorunludur, bu yüzden onay profille birlikte kaydedilir. */
    async registerWithEmail(email: string, password: string, displayName?: string) {
        const result = await createUserWithEmailAndPassword(this.auth, email, password);
        if (displayName && result.user) {
            try {
                await updateProfile(result.user, { displayName });
            } catch (e) {
                console.warn('Display name update error:', e);
            }
        }
        // Yeni kullanıcıyı Firestore'a kaydet ve cache'le
        const profile = await this.userService.createOrUpdateUserProfile(result.user, { acceptTerms: true });
        if (displayName) {
            profile.displayName = displayName;
            await this.userService.updateUserProfile(result.user.uid, { displayName });
        }
        this.cacheProfile(profile);
        return result.user;
    }

    /** Girişli kullanıcının kullanım şartları onayını kaydeder (profili yoksa oluşturur). */
    async acceptTerms(): Promise<void> {
        const current = this.currentUser;
        if (!current) throw new Error('Not signed in');
        const profile = await this.userService.createOrUpdateUserProfile(current, { acceptTerms: true });
        this.cacheProfile(profile);
    }

    /** Girişli kullanıcı kullanım şartlarını onaylamış mı? Önce önbelleğe, yoksa Firestore'a bakar. */
    async hasAcceptedTerms(): Promise<boolean> {
        const current = this.currentUser;
        if (!current) return false;
        const cached = this.userProfile;
        if (cached?.uid === current.uid && cached.termsAcceptedAt) return true;
        const profile = await this.userService.getUserProfile(current.uid);
        if (profile) this.cacheProfile(profile);
        return !!profile?.termsAcceptedAt;
    }

    async resetPassword(email: string): Promise<void> {
        await sendPasswordResetEmail(this.auth, email);
    }

    async logout() {
        this.clearCachedProfile();
        await signOut(this.auth);
        this.router.navigate(['/']);
    }

    async loadUserProfile(): Promise<UserProfile | null> {
        if (this.currentUser) {
            const profile = await this.userService.getUserProfile(this.currentUser.uid);
            if (profile) {
                this.cacheProfile(profile);
            }
            return profile;
        }
        return null;
    }

    /**
     * Cache'deki profili günceller (profil değişikliklerinde çağrılır)
     */
    updateCachedProfile(profile: UserProfile): void {
        this.cacheProfile(profile);
    }
}
