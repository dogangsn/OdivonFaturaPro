// Yayından sonra sitemap'teki adresleri IndexNow'a bildirir (Bing, Yandex, Seznam, Naver).
// Anahtar dosyası public/5fad9eaa44431189a732dccf709605f6.txt olarak sitenin kökünde yayınlanır; arama motoru sahipliği onunla doğrular.
import { readFileSync } from 'node:fs';

const HOST = 'faturapro.odivon.com';
const KEY = '5fad9eaa44431189a732dccf709605f6';

const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
});
console.log(`IndexNow: ${urlList.length} adres gönderildi, yanıt ${res.status}`);
// 200/202 kabul; diğer kodlar yayını bozmasın diye yalnızca loglanır.
