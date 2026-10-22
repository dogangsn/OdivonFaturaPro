import { Component, computed, inject } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { LanguageService } from '../../core/services/language.service';
import { SiteFooterComponent } from '../../shared/components/site-footer/site-footer.component';
import { ARTICLES, articleMeta } from '../../core/constants/articles.constant';
import { ARTICLE_BODIES, ArticleBlock } from './article-content';

/** Türkçe rehber yazısı (/tr/rehber/<slug>). Yalnızca Türkçe olduğu için dil seçici gösterilmez. */
@Component({
    selector: 'app-article',
    standalone: true,
    imports: [CommonModule, RouterModule, SiteFooterComponent],
    templateUrl: './article.component.html'
})
export class ArticleComponent {
    lang = inject(LanguageService);
    private route = inject(ActivatedRoute);

    private slug = toSignal(this.route.paramMap.pipe(map(p => p.get('slug'))), {
        initialValue: this.route.snapshot.paramMap.get('slug')
    });
    readonly meta = computed(() => articleMeta(this.slug()));
    readonly body = computed(() => ARTICLE_BODIES[this.slug() ?? '']);
    readonly others = computed(() => ARTICLES.filter(a => a.slug !== this.slug()));

    updated(date: string): string {
        return formatDate(date, 'longDate', 'tr');
    }

    isList(block: ArticleBlock): block is { ul: string[] } {
        return typeof block !== 'string' && 'ul' in block;
    }

    isOrdered(block: ArticleBlock): block is { ol: string[] } {
        return typeof block !== 'string' && 'ol' in block;
    }
}
