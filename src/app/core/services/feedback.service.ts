import { Injectable, Injector, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Firestore, addDoc, collection, serverTimestamp } from '@angular/fire/firestore';
import { BUSINESS } from '../constants/business.constant';

export const FEEDBACK_MAX_LENGTH = 2000;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export interface FeedbackInput {
    message: string;
    /** Yanıt verilebilmesi için isteğe bağlı e-posta. */
    email?: string;
    lang: string;
    page: string;
}

/**
 * Geri bildirimi Firestore /mail koleksiyonuna, Firebase "Trigger Email from Firestore" eklentisinin
 * beklediği biçimde yazar; eklenti kurulduğunda BUSINESS.feedbackEmail adresine e-posta olarak gider.
 * Eklenti kurulu değilken mesajlar Firestore konsolunda /mail altında birikir, kaybolmaz.
 */
@Injectable({ providedIn: 'root' })
export class FeedbackService {
    private platformId = inject(PLATFORM_ID);
    private injector = inject(Injector);

    async send(input: FeedbackInput): Promise<void> {
        if (!isPlatformBrowser(this.platformId)) return;
        const firestore = this.injector.get(Firestore);
        const message = input.message.trim().slice(0, FEEDBACK_MAX_LENGTH);
        const email = input.email?.trim().slice(0, 200);
        const replyTo = email && EMAIL_PATTERN.test(email) ? email : undefined;
        const text = [
            message,
            '',
            '---',
            `E-posta: ${email || '-'}`,
            `Dil: ${input.lang}`,
            `Sayfa: ${input.page}`,
        ].join('\n');

        await addDoc(collection(firestore, 'mail'), {
            to: BUSINESS.feedbackEmail,
            ...(replyTo ? { replyTo } : {}),
            message: { subject: `Odivon geri bildirim (${input.lang})`, text },
            source: 'feedback',
            createdAt: serverTimestamp(),
        });
    }
}
