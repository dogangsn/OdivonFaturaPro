import { RenderMode, ServerRoute } from '@angular/ssr';
import { SUPPORTED_LANGUAGES } from './core/services/language.service';
import { COUNTRY_GUIDES } from './core/constants/country-guides.constant';
import { ARTICLES } from './core/constants/articles.constant';

// Dil önekli ana sayfa, ülke rehberleri ve ücretsiz araçlar derlemede her dil için statik HTML olarak üretilir; arama motorları
// ve sosyal medya önizlemeleri içeriği JavaScript çalıştırmadan görür. Geri kalan her şey tarayıcıda çizilir.
export const serverRoutes: ServerRoute[] = [
  ...SUPPORTED_LANGUAGES.flatMap(({ code }): ServerRoute[] => [
    { path: code, renderMode: RenderMode.Prerender },
    { path: `${code}/tools/vat-calculator`, renderMode: RenderMode.Prerender },
    {
      path: `${code}/invoice/:country`,
      renderMode: RenderMode.Prerender,
      getPrerenderParams: async () => COUNTRY_GUIDES.map(g => ({ country: g.slug })),
    },
  ]),
  { path: 'tr/rehber', renderMode: RenderMode.Prerender },
  {
    path: 'tr/rehber/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => ARTICLES.map(a => ({ slug: a.slug })),
  },
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
