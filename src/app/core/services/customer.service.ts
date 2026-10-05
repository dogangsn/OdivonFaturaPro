import { Injectable, inject, PLATFORM_ID, Injector } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, serverTimestamp, onSnapshot } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Customer, CustomerFormData } from '../models/customer.model';
import { Observable, map, of, from, switchMap } from 'rxjs';
import { LanguageService } from './language.service';

@Injectable({
    providedIn: 'root'
})
export class CustomerService {
    private platformId = inject(PLATFORM_ID);
    private injector = inject(Injector);
    private lang = inject(LanguageService);

    // Lazy injection - sadece browser'da kullanılacak
    private _firestore: Firestore | null = null;
    private _auth: Auth | null = null;

    private get firestore(): Firestore | null {
        if (!isPlatformBrowser(this.platformId)) return null;
        if (!this._firestore) {
            this._firestore = this.injector.get(Firestore);
        }
        return this._firestore;
    }

    private get auth(): Auth | null {
        if (!isPlatformBrowser(this.platformId)) return null;
        if (!this._auth) {
            this._auth = this.injector.get(Auth);
        }
        return this._auth;
    }

    /**
     * Kullanıcının müşterilerini gerçek zamanlı olarak getirir
     */
    getCustomers(): Observable<Customer[]> {
        if (!isPlatformBrowser(this.platformId) || !this.firestore || !this.auth) {
            return of([]);
        }

        const auth = this.auth;
        const firestore = this.firestore;

        return from(auth.authStateReady()).pipe(
            switchMap(() => {
                const userId = auth.currentUser?.uid;
                if (!userId) {
                    return of([]);
                }

                return new Observable<Customer[]>(subscriber => {
                    const customersCol = collection(firestore, 'customers');
                    const q = query(customersCol, where('userId', '==', userId));

                    const unsubscribe = onSnapshot(q, (snapshot) => {
                        const customers: Customer[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Customer);
                        customers.sort((a, b) => {
                            const timeA = this.parseDateToTime(a.createdAt);
                            const timeB = this.parseDateToTime(b.createdAt);
                            return timeB - timeA;
                        });
                        subscriber.next(customers);
                    }, (error) => {
                        console.error('Müşteriler dinlenirken hata:', error);
                        subscriber.error(error);
                    });

                    return () => unsubscribe();
                });
            })
        );
    }

    private parseDateToTime(val: any): number {
        if (!val) return 0;
        if (typeof val.toDate === 'function') return val.toDate().getTime();
        if (typeof val.seconds === 'number') return val.seconds * 1000;
        const d = new Date(val);
        return isNaN(d.getTime()) ? 0 : d.getTime();
    }

    /**
     * Tek bir müşteriyi getirir
     */
    async getCustomer(id: string): Promise<Customer | null> {
        if (!isPlatformBrowser(this.platformId) || !this.firestore) return null;

        const customerRef = doc(this.firestore, 'customers', id);
        const customerSnap = await getDoc(customerRef);

        if (customerSnap.exists()) {
            return { id: customerSnap.id, ...customerSnap.data() } as Customer;
        }
        return null;
    }

    /**
     * Yeni müşteri ekler
     */
    async addCustomer(data: CustomerFormData): Promise<string> {
        if (!isPlatformBrowser(this.platformId) || !this.firestore || !this.auth) {
            throw new Error(this.lang.t('err.browserOnly'));
        }

        await this.auth.authStateReady();
        const userId = this.auth.currentUser?.uid;
        if (!userId) throw new Error(this.lang.t('err.notLoggedIn'));

        const customersCol = collection(this.firestore, 'customers');

        const customerData = this.removeUndefinedFields({
            ...data,
            userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        const docRef = await addDoc(customersCol, customerData);
        return docRef.id;
    }

    /**
     * Müşteri bilgilerini günceller
     */
    async updateCustomer(id: string, data: Partial<CustomerFormData>): Promise<void> {
        if (!isPlatformBrowser(this.platformId) || !this.firestore) return;

        const cleaned = this.removeUndefinedFields({
            ...data,
            updatedAt: serverTimestamp()
        });

        const customerRef = doc(this.firestore, 'customers', id);
        await updateDoc(customerRef, cleaned);
    }

    private removeUndefinedFields(obj: any): any {
        if (obj === null || obj === undefined) return null;
        if (typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(item => this.removeUndefinedFields(item));

        const result: any = {};
        for (const key of Object.keys(obj)) {
            if (obj[key] !== undefined) {
                result[key] = this.removeUndefinedFields(obj[key]);
            }
        }
        return result;
    }

    /**
     * Müşteri siler
     */
    async deleteCustomer(id: string): Promise<void> {
        if (!isPlatformBrowser(this.platformId) || !this.firestore) return;

        const customerRef = doc(this.firestore, 'customers', id);
        await deleteDoc(customerRef);
    }

    /**
     * Birden fazla müşteri siler
     */
    async deleteCustomers(ids: string[]): Promise<void> {
        if (!isPlatformBrowser(this.platformId) || !this.firestore) return;

        const deletePromises = ids.map(id => this.deleteCustomer(id));
        await Promise.all(deletePromises);
    }
    /**
     * Cari mutabakat durumunu günceller
     */
    async updateReconciliation(id: string, status: 'agreed' | 'disputed' | 'pending', notes?: string): Promise<void> {
        if (!isPlatformBrowser(this.platformId) || !this.firestore) return;

        const customerRef = doc(this.firestore, 'customers', id);
        await updateDoc(customerRef, {
            reconciliationStatus: status,
            reconciliationDate: new Date().toISOString(),
            reconciliationNotes: notes || '',
            updatedAt: serverTimestamp()
        });
    }

    /**
     * Cari hesap bakiyesini günceller
     */
    async updateBalance(id: string, newBalance: number): Promise<void> {
        if (!isPlatformBrowser(this.platformId) || !this.firestore) return;

        const customerRef = doc(this.firestore, 'customers', id);
        await updateDoc(customerRef, {
            balance: newBalance,
            updatedAt: serverTimestamp()
        });
    }

    /**
     * Müşteri için dinamik finansal risk skoru ve seviyesini hesaplar
     */
    calculateCustomerRisk(customer: Customer, customerInvoices: any[]): { score: number; level: 'low' | 'medium' | 'high'; reason: string } {
        const now = new Date();
        const activeInvoices = customerInvoices.filter(inv => inv.status !== 'cancelled');
        const overdueInvoices = activeInvoices.filter(inv => inv.status !== 'paid' && new Date(inv.dueDate || inv.date) < now);
        const overdueAmount = overdueInvoices.reduce((s, i) => s + (i.total || 0), 0);
        const totalInvoiced = activeInvoices.reduce((s, i) => s + (i.total || 0), 0);

        let score = 15; // Taban başlangıç skoru (Güvenli)
        let reason = this.lang.t('risk.reasonRegular');

        if (overdueAmount > 0) {
            const overdueRatio = totalInvoiced > 0 ? (overdueAmount / totalInvoiced) : 1;
            score += Math.min(60, Math.round(overdueRatio * 70));
            score += Math.min(25, overdueInvoices.length * 5);
        }

        if (customer.creditLimit && (customer.balance || 0) > customer.creditLimit) {
            score += 20;
            reason = this.lang.t('risk.reasonCreditLimit');
        }

        score = Math.min(100, Math.max(0, score));

        let level: 'low' | 'medium' | 'high' = 'low';
        if (score >= 70) {
            level = 'high';
            reason = this.lang.t('risk.reasonCritical', { amount: '₺' + overdueAmount.toLocaleString(this.lang.locale, { minimumFractionDigits: 2 }) });
        } else if (score >= 40) {
            level = 'medium';
            reason = this.lang.t('risk.reasonMedium', { count: overdueInvoices.length });
        }

        return { score, level, reason };
    }
}
