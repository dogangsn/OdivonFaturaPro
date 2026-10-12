// Sitenin herkese açık adresi. Canonical, hreflang, Open Graph ve yapılandırılmış veri bu adresle yazılır;
// önceden render edilen sayfalarda tarayıcı adresi bilinmediği için location.origin kullanılamaz.
// Eski Firebase adresi (generateinvoiceweb.web.app) de açılır ama arama motorlarına bu adres gösterilir.
// Adres değişirse bunu, src/index.html'i ve scripts/generate-sitemap.mjs'i güncelleyip sitemap'i yeniden üretin.
export const SITE_URL = 'https://faturapro.odivon.com';
