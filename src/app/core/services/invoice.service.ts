import { Injectable, inject, PLATFORM_ID, Injector } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc, getDoc, query, where, serverTimestamp, onSnapshot } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Invoice, InvoiceFormData, InvoiceItem } from '../models/invoice.model';
import { Observable, map, of, from, switchMap } from 'rxjs';

import { LanguageService } from './language.service';
@Injectable({
    providedIn: 'root'
})
export class InvoiceService {
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
     * Kullanıcının faturalarını gerçek zamanlı olarak getirir
     */
    getInvoices(): Observable<Invoice[]> {
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

                return new Observable<Invoice[]>(subscriber => {
                    const invoicesCol = collection(firestore, 'invoices');
                    const q = query(invoicesCol, where('userId', '==', userId));

                    const unsubscribe = onSnapshot(q, (snapshot) => {
                        const invoices: Invoice[] = snapshot.docs.map(doc => {
                            const data = doc.data();
                            return {
                                id: doc.id,
                                ...data
                            } as Invoice;
                        });

                        invoices.sort((a, b) => {
                            const timeA = this.parseDateToTime(a.createdAt) || this.parseDateToTime(a.date);
                            const timeB = this.parseDateToTime(b.createdAt) || this.parseDateToTime(b.date);
                            return timeB - timeA;
                        });

                        subscriber.next(invoices);
                    }, (error) => {
                        console.error('Faturalar dinlenirken hata:', error);
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
     * Tek bir faturayı getirir
     */
    async getInvoice(id: string): Promise<Invoice | null> {
        if (!isPlatformBrowser(this.platformId) || !this.firestore) return null;

        const invoiceRef = doc(this.firestore, 'invoices', id);
        const invoiceSnap = await getDoc(invoiceRef);

        if (invoiceSnap.exists()) {
            return { id: invoiceSnap.id, ...invoiceSnap.data() } as Invoice;
        }
        return null;
    }

    /**
     * Yeni fatura oluşturur
     */
    async createInvoice(data: InvoiceFormData): Promise<string> {
        if (!isPlatformBrowser(this.platformId) || !this.firestore || !this.auth) {
            throw new Error(this.lang.t('err.browserOnly'));
        }

        await this.auth.authStateReady();
        const userId = this.auth.currentUser?.uid;
        if (!userId) throw new Error(this.lang.t('err.notLoggedIn'));

        const { subtotal, taxTotal, total } = this.calculateTotals(data);
        const invoicesCol = collection(this.firestore, 'invoices');

        const invoiceData = this.removeUndefinedFields({
            ...data,
            subtotal,
            taxTotal,
            total,
            userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        const docRef = await addDoc(invoicesCol, invoiceData);
        return docRef.id;
    }

    /**
     * Fatura günceller
     */
    async updateInvoice(id: string, data: Partial<InvoiceFormData>): Promise<void> {
        if (!isPlatformBrowser(this.platformId) || !this.firestore) return;

        const updateData: any = {
            ...data,
            updatedAt: serverTimestamp()
        };

        if (data.items) {
            const { subtotal, taxTotal, total } = this.calculateTotals(data as InvoiceFormData);
            updateData.subtotal = subtotal;
            updateData.taxTotal = taxTotal;
            updateData.total = total;
        }

        const cleanedData = this.removeUndefinedFields(updateData);
        const invoiceRef = doc(this.firestore, 'invoices', id);
        await updateDoc(invoiceRef, cleanedData);
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
     * Fatura durumunu günceller
     */
    async updateInvoiceStatus(id: string, status: Invoice['status']): Promise<void> {
        if (!isPlatformBrowser(this.platformId) || !this.firestore) return;

        const invoiceRef = doc(this.firestore, 'invoices', id);
        await updateDoc(invoiceRef, {
            status,
            updatedAt: serverTimestamp()
        });
    }

    /**
     * Fatura siler
     */
    async deleteInvoice(id: string): Promise<void> {
        if (!isPlatformBrowser(this.platformId) || !this.firestore) return;

        const invoiceRef = doc(this.firestore, 'invoices', id);
        await deleteDoc(invoiceRef);
    }

    /**
     * Birden fazla fatura siler
     */
    async deleteInvoices(ids: string[]): Promise<void> {
        if (!isPlatformBrowser(this.platformId) || !this.firestore) return;

        const deletePromises = ids.map(id => this.deleteInvoice(id));
        await Promise.all(deletePromises);
    }

    /**
     * Yeni fatura numarası üretir
     */
    generateInvoiceNumber(): string {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `INV-${year}-${random}`;
    }

    /**
     * Fatura onay durumunu günceller (Onaylandı / Reddedildi / Onay Bekliyor)
     */
    async updateApprovalStatus(id: string, approvalStatus: 'pending_approval' | 'approved' | 'rejected', note?: string): Promise<void> {
        if (!isPlatformBrowser(this.platformId) || !this.firestore) return;

        const invoiceRef = doc(this.firestore, 'invoices', id);
        const updatePayload: any = {
            approvalStatus,
            updatedAt: serverTimestamp()
        };
        if (approvalStatus === 'approved') {
            updatePayload.approvedAt = serverTimestamp();
        }
        if (note) {
            updatePayload.approvalNote = note;
        }

        await updateDoc(invoiceRef, updatePayload);
    }

    /**
     * Toplamları hesaplar ve her kaleme satır KDV ve toplamını yazar
     */
    private calculateTotals(data: InvoiceFormData): { subtotal: number; taxTotal: number; total: number } {
        let subtotal = 0;
        let totalDiscount = 0;
        let mainTaxTotal = 0;
        const items = data.items || [];

        items.forEach(item => {
            const quantity = item.quantity || 0;
            const unitPrice = item.unitPrice || 0;
            const gross = quantity * unitPrice;
            const discount = gross * ((item.discount || 0) / 100);
            const net = gross - discount;

            subtotal += gross;
            totalDiscount += discount;

            const itemTaxRate = item.taxRate !== undefined ? item.taxRate : (data.taxRate !== undefined ? data.taxRate : 20);
            const lineTax = net * (itemTaxRate / 100);
            item.taxAmount = lineTax;
            item.total = net;
            item.totalWithTax = net + lineTax;

            mainTaxTotal += lineTax;
        });

        const netSubtotal = subtotal - totalDiscount;

        let additionalTaxTotal = 0;
        if (data.additionalTaxes) {
            data.additionalTaxes.forEach(tax => {
                additionalTaxTotal += netSubtotal * ((tax.rate || 0) / 100);
            });
        }

        const taxTotal = mainTaxTotal + additionalTaxTotal;
        const total = netSubtotal + taxTotal;

        return {
            subtotal,
            taxTotal,
            total
        };
    }
}
