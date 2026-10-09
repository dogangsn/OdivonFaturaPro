import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';

/** Tanımsız adresler: ana sayfaya sessizce yönlendirmek yerine açıkça "bulunamadı" gösterir. */
@Component({
    selector: 'app-not-found',
    standalone: true,
    imports: [RouterModule],
    template: `
    <main class="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center gap-4 p-6 text-center bg-slate-50 dark:bg-slate-950">
        <span class="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700" aria-hidden="true">link_off</span>
        <h1 class="text-2xl font-black text-slate-900 dark:text-white">{{ lang.t('notFound.title') }}</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 max-w-md">{{ lang.t('notFound.text') }}</p>
        <a routerLink="/" class="mt-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-blue-700">{{ lang.t('notFound.home') }}</a>
    </main>
    `
})
export class NotFoundComponent {
    lang = inject(LanguageService);
}
