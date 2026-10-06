import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface CheckoutFormResponse {
    paymentPageUrl: string;
    token: string;
    conversationId: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);

    async initializeCheckoutForm(planId: 'pro' | 'enterprise'): Promise<CheckoutFormResponse> {
        const user = this.authService.currentUser;
        if (!user) throw new Error('AUTH_REQUIRED');

        const idToken = await user.getIdToken();
        const headers = new HttpHeaders({ Authorization: `Bearer ${idToken}` });
        return firstValueFrom(
            this.http.post<CheckoutFormResponse>(
                `${environment.functionsBaseUrl}/initializeCheckoutForm`,
                { planId },
                { headers },
            ),
        );
    }
}
