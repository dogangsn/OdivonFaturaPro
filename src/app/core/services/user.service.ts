import { Injectable, inject } from '@angular/core';
import { Firestore, doc, setDoc, getDoc, updateDoc, serverTimestamp } from '@angular/fire/firestore';
import { User } from '@angular/fire/auth';
import { UserProfile } from '../models/user.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { TERMS_VERSION } from '../constants/legal.constant';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private firestore = inject(Firestore);
    private userProfileSubject = new BehaviorSubject<UserProfile | null>(null);
    userProfile$: Observable<UserProfile | null> = this.userProfileSubject.asObservable();

    /**
     * Kullanıcı profilini Firestore'dan getirir
     */
    async getUserProfile(uid: string): Promise<UserProfile | null> {
        const userRef = doc(this.firestore, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            if (!data.plan) {
                data.plan = 'free';
                data.monthlyInvoiceLimit = 5;
                data.customerLimit = 5;
                await updateDoc(userRef, {
                    plan: 'free',
                    monthlyInvoiceLimit: 5,
                    customerLimit: 5
                });
            }
            this.userProfileSubject.next(data);
            return data;
        }
        return null;
    }

    /**
     * Yeni kullanıcı profili oluşturur veya mevcut profili günceller.
     * acceptTerms: kullanıcı kullanım şartlarını bu adımda açıkça onayladı; onay zamanı ve sürümü kaydedilir.
     */
    async createOrUpdateUserProfile(user: User, opts: { acceptTerms?: boolean } = {}): Promise<UserProfile> {
        const termsFields = opts.acceptTerms ? { termsAcceptedAt: serverTimestamp(), termsVersion: TERMS_VERSION } : {};
        const userRef = doc(this.firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            const updates: any = {
                displayName: user.displayName || '',
                photoURL: user.photoURL || null,
                ...termsFields,
                updatedAt: serverTimestamp()
            };

            if (!data.plan) {
                updates.plan = 'free';
                updates.monthlyInvoiceLimit = 5;
                updates.customerLimit = 5;
            }

            await updateDoc(userRef, updates);
            const updatedProfile = { ...data, ...updates };
            this.userProfileSubject.next(updatedProfile);
            return updatedProfile;
        } else {
            // Yeni kullanıcı - varsayılan olarak Ücretsiz Plan (5 Fatura & 5 Müşteri Limiti)
            const newProfile: any = {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || '',
                photoURL: user.photoURL || null,
                phoneNumber: user.phoneNumber || null,
                companyName: null,
                companyAddress: null,
                taxId: null,
                taxOffice: null,
                country: 'TR',
                iban: null,
                bankName: null,
                logoUrl: null,
                phone: null,
                plan: 'free',
                monthlyInvoiceLimit: 5,
                customerLimit: 5,
                // Onay yoksa giriş ekranı şartları onaylatmadan panele geçirmez (authGuard)
                ...termsFields,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await setDoc(userRef, newProfile);
            this.userProfileSubject.next(newProfile as UserProfile);
            return newProfile as UserProfile;
        }
    }

    /**
     * Kullanıcı profilini günceller
     */
    async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
        const userRef = doc(this.firestore, 'users', uid);
        await updateDoc(userRef, {
            ...data,
            updatedAt: serverTimestamp()
        });

        // Re-fetch profile to keep Subject updated
        const updated = await this.getUserProfile(uid);
        if (updated) {
            this.userProfileSubject.next(updated);
        }
    }
}
