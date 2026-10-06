// Satıcı ve satış bilgileri. Yasal metinlerde, fiyatlandırma ve iletişim butonlarında kullanılır.
// Boş bırakılan alanlar arayüzde gizlenir veya "belirtilecek" olarak görünür; yayından önce doldurun.
export const BUSINESS = {
    legalName: 'Odivon Bilişim Teknolojileri',
    address: '',
    taxOffice: '',
    taxNumber: '',
    mersisNo: '',
    supportEmail: 'destek@odivon.com',
    /** Ülke koduyla, başında + olmadan (ör. 905321234567). Boşsa WhatsApp butonu gizlenir. */
    salesWhatsApp: '',
};

// Google AdSense: yalnızca ücretsiz plandaki kullanıcılara gösterilir.
// Yayıncı kimliği (ca-pub-...) ve reklam birimi kimliği boşsa hiçbir reklam yüklenmez.
export const ADSENSE = {
    clientId: '',
    slotId: '',
};

// iyzico ile kartla ödeme (functions/ altındaki Cloud Functions). Fonksiyonlar ve iyzico anahtarları
// yayınlanmadan açmayın; ayrıntılar docs/iyzico-sandbox.md.
export const PAYMENTS = {
    enabled: false,
};
