export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    phoneNumber: string | null;
    companyName: string | null;
    companyAddress: string | null;
    taxId: string | null;
    taxOffice: string | null;
    country: string | null;
    iban: string | null;
    bankName: string | null;
    logoUrl: string | null;
    phone: string | null;
    plan: 'free' | 'pro' | 'enterprise';
    monthlyInvoiceLimit?: number;
    customerLimit?: number;
    termsAcceptedAt?: Date;
    /** Onaylanan kullanım şartları sürümü (TERMS_VERSION). */
    termsVersion?: string;
    createdAt: Date;
    updatedAt: Date;
}
