// Türkçe rehber yazıları (/tr/rehber/<slug>). Yalnızca Türkçe yayınlanır; hreflang yoktur.
// Başlık ve açıklama burada (SeoService ve ana sayfa kullanır); yazı gövdeleri ayrı parçada yüklenir (article-content.ts).
// Yeni yazı eklenince scripts/generate-sitemap.mjs içindeki ARTICLES listesi de güncellenmeli (release testi kontrol eder).

export interface ArticleMeta {
    slug: string;
    title: string;
    /** Meta açıklama: 50–160 karakter. */
    description: string;
    /** Son güncelleme (YYYY-AA-GG). */
    updated: string;
}

export const ARTICLES: ArticleMeta[] = [
    {
        slug: 'fatura-nasil-kesilir',
        title: 'Fatura Nasıl Kesilir? Adım Adım Rehber',
        description: 'Fatura kesmek için gereken bilgiler, adımlar, süreler ve sık yapılan hatalar. Kağıt, e-Fatura ve e-Arşiv için sade bir başlangıç rehberi.',
        updated: '2026-10-22',
    },
    {
        slug: 'proforma-fatura-nedir',
        title: 'Proforma Fatura Nedir, Ne İşe Yarar?',
        description: 'Proforma faturanın tanımı, normal faturadan farkı, ne zaman kullanıldığı ve içinde hangi bilgilerin bulunması gerektiği.',
        updated: '2026-10-22',
    },
    {
        slug: 'e-fatura-e-arsiv-farki',
        title: 'e-Fatura ve e-Arşiv Fatura Farkı',
        description: 'e-Fatura ile e-Arşiv fatura arasındaki farklar: kime düzenlenir, nasıl iletilir, kimler geçmek zorundadır ve iptal nasıl yapılır.',
        updated: '2026-10-22',
    },
    {
        slug: 'kdv-nasil-hesaplanir',
        title: 'KDV Nasıl Hesaplanır? KDV Dahil ve Hariç',
        description: 'KDV hariç tutara KDV ekleme ve KDV dahil tutardan KDV ayırma formülleri, güncel oranlar (%1, %10, %20) ve örnek hesaplar.',
        updated: '2026-10-22',
    },
    {
        slug: 'faturada-bulunmasi-gereken-bilgiler',
        title: 'Faturada Bulunması Zorunlu Bilgiler',
        description: 'Vergi Usul Kanunu 230. maddeye göre bir faturada mutlaka yer alması gereken bilgiler ve eksik fatura düzenlemenin sonuçları.',
        updated: '2026-10-22',
    },
    {
        slug: 'kdv-tevkifati-nedir',
        title: 'KDV Tevkifatı Nedir, Faturada Nasıl Gösterilir?',
        description: 'KDV tevkifatının mantığı, kimlerin uygulaması gerektiği, oranların okunuşu ve tevkifatlı faturanın örnek hesabı.',
        updated: '2026-10-22',
    },
    {
        slug: 'serbest-meslek-makbuzu',
        title: 'Serbest Meslek Makbuzu Nedir? Faturadan Farkı',
        description: 'Serbest meslek makbuzu kimler tarafından düzenlenir, stopaj ve KDV nasıl hesaplanır, e-SMM nedir ve faturadan farkları nelerdir.',
        updated: '2026-10-22',
    },
    {
        slug: 'fatura-duzenleme-suresi',
        title: 'Fatura Düzenleme Süresi: 7 Gün Kuralı',
        description: 'Fatura teslimden kaç gün içinde düzenlenmeli? 7 gün kuralı, sürenin nasıl sayıldığı ve geç kesilen faturanın sonuçları.',
        updated: '2026-10-22',
    },
    {
        slug: 'yurt-disina-fatura-kesme',
        title: 'Yurt Dışına Fatura Nasıl Kesilir?',
        description: 'Yurt dışındaki müşteriye hizmet veya mal faturası: KDV istisnası, döviz cinsinden fatura, kur çevrimi ve çift dilli fatura önerileri.',
        updated: '2026-10-22',
    },
    {
        slug: 'fatura-iptali-ve-iade-faturasi',
        title: 'Fatura İptali ve İade Faturası Nasıl Yapılır?',
        description: 'Hatalı faturanın iptali, e-Fatura ve e-Arşiv faturada iptal ve itiraz süreçleri ile iade faturasının ne zaman ve kim tarafından kesileceği.',
        updated: '2026-10-22',
    },
];

export function articleMeta(slug: string | null | undefined): ArticleMeta | undefined {
    return ARTICLES.find(a => a.slug === slug);
}

/** Rehber listesi sayfasının (/tr/rehber) başlık ve açıklaması. */
export const ARTICLES_INDEX: Pick<ArticleMeta, 'title' | 'description'> = {
    title: 'Fatura ve KDV Rehberleri',
    description: 'Fatura kesme, KDV hesaplama, e-Fatura ve e-Arşiv, KDV tevkifatı, serbest meslek makbuzu ve yurt dışı faturası hakkında pratik Türkçe rehberler.',
};
