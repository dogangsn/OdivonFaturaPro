import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';
import { ARTICLES } from '../../core/constants/articles.constant';

/** Türkçe rehber yazılarının listesi (/tr/rehber). */
@Component({
    selector: 'app-articles-index',
    standalone: true,
    imports: [CommonModule, RouterModule, SiteFooterComponent],
    template: `
    <div class="min-h-screen min-h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950">
        <header class="flex items-center justify-between px-4 sm:px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <a routerLink="/tr" class="flex items-center gap-2 text-primary" aria-label="Ana sayfa">
                <img src="/logo-128.webp" alt="" class="w-8 h-8 object-contain">
                <span class="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">Odivon <span class="text-primary">FaturaPro</span></span>
            </a>
        </header>

        <main class="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
            <h1 class="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Fatura ve KDV Rehberleri</h1>
            <p class="mt-3 mb-8 text-lg text-slate-500">Fatura kesme, KDV hesaplama, e-Fatura ve e-Arşiv, tevkifat ve yurt dışı faturası hakkında sade, pratik rehberler.</p>
            <ul class="space-y-3">
                <li *ngFor="let a of articles">
                    <a [routerLink]="['/tr/rehber', a.slug]"
                        class="block rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 hover:border-primary transition-colors">
                        <h2 class="text-lg font-bold text-slate-900 dark:text-white">{{ a.title }}</h2>
                        <p class="mt-1 text-sm text-slate-500">{{ a.description }}</p>
                    </a>
                </li>
            </ul>
        </main>

        <app-site-footer></app-site-footer>
    </div>
    `
})
export class ArticlesIndexComponent {
    lang = inject(LanguageService);
    readonly articles = ARTICLES;
}
