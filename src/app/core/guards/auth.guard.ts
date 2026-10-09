import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
    const auth = inject(Auth);
    const router = inject(Router);
    const authService = inject(AuthService);

    // Firebase auth state'inin yüklenmesini bekle
    await auth.authStateReady();
    
    if (!auth.currentUser) {
        return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }

    // Kullanım şartlarını onaylamamış kullanıcı (ör. Google ile ilk girişte onay ekranını kapatan) panele giremez.
    try {
        if (!(await authService.hasAcceptedTerms())) {
            return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url, consent: 1 } });
        }
    } catch (error) {
        // Profil okunamadıysa (ör. ağ hatası) kullanıcıyı kilitleme; onay bir sonraki girişte istenir.
        console.error('Terms check failed:', error);
    }
    return true;
};
