import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import Swal, { SweetAlertIcon, SweetAlertOptions } from 'sweetalert2';
import { LanguageService } from './language.service';

@Injectable({
    providedIn: 'root'
})
export class AlertService {
    private platformId = inject(PLATFORM_ID);
    private lang = inject(LanguageService);

    private get isBrowser(): boolean {
        return isPlatformBrowser(this.platformId);
    }

    private get isDark(): boolean {
        if (!this.isBrowser) return false;
        return document.documentElement.classList.contains('dark');
    }

    private getBaseOptions(): SweetAlertOptions {
        const dark = this.isDark;
        return {
            background: dark ? '#0f172a' : '#ffffff',
            color: dark ? '#f8fafc' : '#0f172a',
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#64748b',
            customClass: {
                popup: 'rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl font-sans',
                confirmButton: 'rounded-xl px-5 py-2.5 font-semibold text-sm shadow-md',
                cancelButton: 'rounded-xl px-5 py-2.5 font-semibold text-sm'
            }
        };
    }

    /**
     * Başarı mesajı (Animasyonlu)
     */
    success(title: string, text?: string): Promise<any> {
        if (!this.isBrowser) return Promise.resolve();
        return Swal.fire({
            ...this.getBaseOptions(),
            icon: 'success',
            title,
            text,
            showConfirmButton: true,
            confirmButtonText: this.lang.t('alert.ok'),
            timer: 2500,
            timerProgressBar: true
        });
    }

    /**
     * Hata mesajı (Animasyonlu)
     */
    error(title: string, text?: string): Promise<any> {
        if (!this.isBrowser) return Promise.resolve();
        return Swal.fire({
            ...this.getBaseOptions(),
            icon: 'error',
            title,
            text,
            confirmButtonColor: '#ef4444',
            confirmButtonText: this.lang.t('alert.close')
        });
    }

    /**
     * Uyarı mesajı (Animasyonlu)
     */
    warning(title: string, text?: string): Promise<any> {
        if (!this.isBrowser) return Promise.resolve();
        return Swal.fire({
            ...this.getBaseOptions(),
            icon: 'warning',
            title,
            text,
            confirmButtonColor: '#f59e0b',
            confirmButtonText: this.lang.t('alert.gotIt')
        });
    }

    /**
     * Bilgi mesajı
     */
    info(title: string, text?: string): Promise<any> {
        if (!this.isBrowser) return Promise.resolve();
        return Swal.fire({
            ...this.getBaseOptions(),
            icon: 'info',
            title,
            text,
            confirmButtonText: this.lang.t('alert.ok')
        });
    }

    /**
     * Onay Modalı (Silme veya Kritik işlemler için)
     */
    async confirm(
        titleOrOptions: string | { title: string; text?: string; confirmButtonText?: string; cancelButtonText?: string; isDanger?: boolean },
        text?: string,
        confirmBtnText = this.lang.t('alert.confirmYes'),
        cancelBtnText = this.lang.t('alert.cancel')
    ): Promise<boolean> {
        if (!this.isBrowser) return false;

        let title = '';
        let msg = '';
        let confirmText = confirmBtnText;
        let cancelText = cancelBtnText;
        let isDanger = true;

        if (typeof titleOrOptions === 'object') {
            title = titleOrOptions.title;
            msg = titleOrOptions.text || '';
            confirmText = titleOrOptions.confirmButtonText || this.lang.t('alert.confirmYes');
            cancelText = titleOrOptions.cancelButtonText || this.lang.t('alert.cancel');
            isDanger = titleOrOptions.isDanger !== false;
        } else {
            title = titleOrOptions;
            msg = text || '';
        }

        const result = await Swal.fire({
            ...this.getBaseOptions(),
            icon: isDanger ? 'warning' : 'question',
            title,
            text: msg,
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            confirmButtonColor: isDanger ? '#ef4444' : '#2563eb',
            cancelButtonColor: '#64748b',
            reverseButtons: true
        });
        return result.isConfirmed;
    }

    /**
     * Hızlı Köşe Bildirimi (Toast)
     */
    toast(title: string, icon: SweetAlertIcon = 'success'): void {
        if (!this.isBrowser) return;
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: this.isDark ? '#1e293b' : '#ffffff',
            color: this.isDark ? '#f8fafc' : '#0f172a',
            customClass: {
                popup: 'rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl'
            },
            didOpen: (toast) => {
                toast.onmouseenter = Swal.stopTimer;
                toast.onmouseleave = Swal.resumeTimer;
            }
        });

        Toast.fire({
            icon,
            title
        });
    }

    /**
     * Yükleniyor / İşlem Sürüyor Animasyonu
     */
    loading(title = this.lang.t('alert.processing')): void {
        if (!this.isBrowser) return;
        Swal.fire({
            ...this.getBaseOptions(),
            title,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    }

    /**
     * Açık olan alert veya loading kutusunu kapatır
     */
    close(): void {
        if (this.isBrowser) {
            Swal.close();
        }
    }
}
