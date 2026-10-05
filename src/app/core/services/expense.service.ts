import { Injectable, inject, PLATFORM_ID, Injector } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc, query, where, onSnapshot } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Expense, ExpenseFormData } from '../models/expense.model';
import { Observable, of, from, switchMap } from 'rxjs';

import { LanguageService } from './language.service';
@Injectable({
    providedIn: 'root'
})
export class ExpenseService {
    private platformId = inject(PLATFORM_ID);
    private injector = inject(Injector);
    private lang = inject(LanguageService);

    private _firestore: Firestore | null = null;
    private _auth: Auth | null = null;
    private readonly LOCAL_STORAGE_KEY = 'faturapro_expenses';

    private get firestore(): Firestore | null {
        if (!isPlatformBrowser(this.platformId)) return null;
        if (!this._firestore) {
            try {
                this._firestore = this.injector.get(Firestore);
            } catch (e) {
                return null;
            }
        }
        return this._firestore;
    }

    private get auth(): Auth | null {
        if (!isPlatformBrowser(this.platformId)) return null;
        if (!this._auth) {
            try {
                this._auth = this.injector.get(Auth);
            } catch (e) {
                return null;
            }
        }
        return this._auth;
    }

    /**
     * Kullanıcının harcama/gider listesini getirir
     */
    getExpenses(): Observable<Expense[]> {
        if (!isPlatformBrowser(this.platformId)) {
            return of([]);
        }

        const auth = this.auth;
        const firestore = this.firestore;

        if (!auth || !firestore) {
            return of(this.getFromLocalStorage());
        }

        return from(auth.authStateReady()).pipe(
            switchMap(() => {
                const userId = auth.currentUser?.uid;
                if (!userId) {
                    return of(this.getFromLocalStorage());
                }

                return new Observable<Expense[]>(subscriber => {
                    const col = collection(firestore, 'expenses');
                    const q = query(col, where('userId', '==', userId));

                    const unsubscribe = onSnapshot(q, (snapshot) => {
                        const expenses: Expense[] = snapshot.docs.map(doc => {
                            const data = doc.data();
                            const rec = data['receiptUrl'] || data['receiptImage'] || '';
                            const mName = data['merchantName'] || data['title'] || '';
                            const desc = data['description'] || data['notes'] || '';
                            return {
                                id: doc.id,
                                ...data,
                                merchantName: mName,
                                description: desc,
                                receiptUrl: rec,
                                receiptImage: rec,
                                date: data['date'] ? (data['date'].toDate ? data['date'].toDate() : new Date(data['date'])) : new Date()
                            } as Expense;
                        });

                        expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        this.saveToLocalStorage(expenses);
                        subscriber.next(expenses);
                    }, error => {
                        console.error('Firestore expenses error:', error);
                        subscriber.next(this.getFromLocalStorage());
                    });

                    return () => unsubscribe();
                });
            })
        );
    }

    /**
     * Yeni gider ekler
     */
    async addExpense(data: ExpenseFormData): Promise<string> {
        const userId = this.auth?.currentUser?.uid || 'anonymous';
        const taxRate = data.taxRate || 20;
        const taxAmount = data.taxAmount !== undefined ? data.taxAmount : Math.round(((data.amount * taxRate) / (100 + taxRate)) * 100) / 100;
        const merchant = data.merchantName || data.title || 'Gider';
        const note = data.notes || data.description || '';
        const receipt = data.receiptImage || data.receiptUrl || '';

        const expenseData: Omit<Expense, 'id'> = {
            userId,
            title: merchant,
            merchantName: merchant,
            supplierName: data.supplierName || merchant,
            category: data.category,
            date: data.date,
            amount: Number(data.amount),
            taxRate: Number(taxRate),
            taxAmount: Number(taxAmount),
            currency: data.currency || 'TRY',
            paymentMethod: data.paymentMethod,
            receiptImage: receipt,
            receiptUrl: receipt,
            notes: note,
            description: note,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        if (this.firestore && userId !== 'anonymous') {
            try {
                const col = collection(this.firestore, 'expenses');
                const docRef = await addDoc(col, expenseData);
                return docRef.id;
            } catch (e) {
                console.warn('Firestore write failed, falling back to local storage:', e);
            }
        }

        // Local Storage Fallback
        const localExpenses = this.getFromLocalStorage();
        const newId = 'exp_' + Date.now();
        const newExpense: Expense = { id: newId, ...expenseData };
        localExpenses.unshift(newExpense);
        this.saveToLocalStorage(localExpenses);
        return newId;
    }

    /**
     * Alias for addExpense
     */
    createExpense(data: ExpenseFormData): Promise<string> {
        return this.addExpense(data);
    }

    /**
     * Gider günceller
     */
    async updateExpense(id: string, data: ExpenseFormData): Promise<void> {
        const taxRate = data.taxRate || 20;
        const taxAmount = data.taxAmount !== undefined ? data.taxAmount : Math.round(((data.amount * taxRate) / (100 + taxRate)) * 100) / 100;
        const merchant = data.merchantName || data.title || 'Gider';
        const note = data.notes || data.description || '';
        const receipt = data.receiptImage || data.receiptUrl || '';

        const updates: Partial<Expense> = {
            title: merchant,
            merchantName: merchant,
            supplierName: data.supplierName || merchant,
            category: data.category,
            date: data.date,
            amount: Number(data.amount),
            taxRate: Number(taxRate),
            taxAmount: Number(taxAmount),
            currency: data.currency || 'TRY',
            paymentMethod: data.paymentMethod,
            receiptImage: receipt,
            receiptUrl: receipt,
            notes: note,
            description: note,
            updatedAt: new Date()
        };

        if (this.firestore && this.auth?.currentUser) {
            try {
                const docRef = doc(this.firestore, 'expenses', id);
                await updateDoc(docRef, updates);
                return;
            } catch (e) {
                console.warn('Firestore update failed, falling back to local storage:', e);
            }
        }

        const localExpenses = this.getFromLocalStorage();
        const index = localExpenses.findIndex(e => e.id === id);
        if (index !== -1) {
            localExpenses[index] = { ...localExpenses[index], ...updates };
            this.saveToLocalStorage(localExpenses);
        }
    }

    /**
     * Gider siler
     */
    async deleteExpense(id: string): Promise<void> {
        if (this.firestore && this.auth?.currentUser) {
            try {
                const docRef = doc(this.firestore, 'expenses', id);
                await deleteDoc(docRef);
                return;
            } catch (e) {
                console.warn('Firestore delete failed, deleting locally:', e);
            }
        }

        const localExpenses = this.getFromLocalStorage().filter(e => e.id !== id);
        this.saveToLocalStorage(localExpenses);
    }

    // Local Storage helpers
    private getFromLocalStorage(): Expense[] {
        if (!isPlatformBrowser(this.platformId)) return [];
        const raw = localStorage.getItem(this.LOCAL_STORAGE_KEY);
        if (!raw) {
            // Başlangıç için örnek kayıtlar
            const initial: Expense[] = [
                {
                    id: 'sample-1',
                    userId: 'default',
                    title: this.lang.t('seed.exp1.title'),
                    category: 'office',
                    date: new Date().toISOString().split('T')[0],
                    amount: 650.0,
                    taxRate: 20,
                    taxAmount: 108.33,
                    paymentMethod: 'credit_card',
                    supplierName: 'D&R Mağazacılık',
                    notes: this.lang.t('seed.exp1.notes')
                },
                {
                    id: 'sample-2',
                    userId: 'default',
                    title: this.lang.t('seed.exp2.title'),
                    category: 'food',
                    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
                    amount: 420.0,
                    taxRate: 10,
                    taxAmount: 38.18,
                    paymentMethod: 'credit_card',
                    supplierName: 'Köşebaşı Kebap',
                    notes: this.lang.t('seed.exp2.notes')
                },
                {
                    id: 'sample-3',
                    userId: 'default',
                    title: this.lang.t('seed.exp3.title'),
                    category: 'fuel',
                    date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
                    amount: 1750.0,
                    taxRate: 20,
                    taxAmount: 291.67,
                    paymentMethod: 'credit_card',
                    supplierName: 'Petrol Ofisi',
                    notes: this.lang.t('seed.exp3.notes')
                }
            ];
            this.saveToLocalStorage(initial);
            return initial;
        }
        try {
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    private saveToLocalStorage(expenses: Expense[]): void {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(expenses));
        }
    }
}
