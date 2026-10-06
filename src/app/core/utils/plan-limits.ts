import { UserProfile } from '../models/user.model';

export const FREE_INVOICE_LIMIT = 5;
export const FREE_CUSTOMER_LIMIT = 5;

type PlanProfile = Pick<UserProfile, 'plan' | 'monthlyInvoiceLimit' | 'customerLimit'> | null | undefined;

export function isFreePlan(profile: PlanProfile): boolean {
    return !profile?.plan || profile.plan === 'free';
}

function toDate(val: any): Date | null {
    if (!val) return null;
    if (typeof val.toDate === 'function') return val.toDate();
    if (typeof val.seconds === 'number') return new Date(val.seconds * 1000);
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
}

/**
 * Bu takvim ayında oluşturulan fatura sayısı (oluşturma tarihi yoksa fatura tarihi kullanılır).
 */
export function countInvoicesThisMonth(invoices: { createdAt?: any; date?: any }[], now = new Date()): number {
    return invoices.filter(inv => {
        const d = toDate(inv.createdAt) || toDate(inv.date);
        return !!d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
}

export function canCreateInvoice(profile: PlanProfile, invoices: { createdAt?: any; date?: any }[], now = new Date()): boolean {
    if (!isFreePlan(profile)) return true;
    return countInvoicesThisMonth(invoices, now) < (profile?.monthlyInvoiceLimit || FREE_INVOICE_LIMIT);
}

export function canAddCustomer(profile: PlanProfile, customerCount: number): boolean {
    if (!isFreePlan(profile)) return true;
    return customerCount < (profile?.customerLimit || FREE_CUSTOMER_LIMIT);
}
