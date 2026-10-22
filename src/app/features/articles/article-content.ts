// Türkçe rehber yazılarının gövdeleri. Başlık ve açıklama core/constants/articles.constant.ts içindedir.
// Blok: düz metin = paragraf, { ul } = madde listesi, { ol } = numaralı liste.

export type ArticleBlock = string | { ul: string[] } | { ol: string[] };

export interface ArticleBody {
    intro: string[];
    sections: { h: string; blocks: ArticleBlock[] }[];
    faq: { q: string; a: string }[];
}

export const ARTICLE_BODIES: Record<string, ArticleBody> = {
    'fatura-nasil-kesilir': {
        intro: [
            'Fatura, sattığınız mal veya verdiğiniz hizmetin karşılığında alıcıya verdiğiniz ve tutarı gösteren resmi ticari belgedir. Hem sizin hem de müşterinizin vergi hesabı bu belgeye dayanır; bu yüzden doğru bilgilerle ve zamanında düzenlenmesi gerekir.',
            'Bu rehberde ilk kez fatura kesecek bir işletmenin bilmesi gerekenleri sırasıyla anlatıyoruz: hangi bilgileri hazırlamanız gerektiği, faturanın hangi biçimde düzenleneceği, süreler ve en sık yapılan hatalar.',
        ],
        sections: [
            {
                h: '1. Fatura kesmeden önce hazırlamanız gereken bilgiler',
                blocks: [
                    'Faturayı doldurmaya başlamadan önce iki tarafın bilgilerini eksiksiz toplayın. Eksik ya da yanlış bilgi, faturanın sonradan iptal edilmesine veya alıcının gider yazamamasına yol açar.',
                    { ul: [
                        'Kendi bilgileriniz: ad soyad veya ticaret unvanı, iş adresi, bağlı olduğunuz vergi dairesi ve vergi kimlik numarası (şahıslarda T.C. kimlik numarası).',
                        'Alıcının bilgileri: adı veya unvanı, adresi, vergi dairesi ve vergi kimlik numarası. Alıcı bir tüketiciyse ad soyad ve adres yeterlidir; e-Arşiv faturada T.C. kimlik numarası da istenebilir.',
                        'Satılan mal veya hizmetin tanımı, miktarı, birimi ve birim fiyatı.',
                        'Uygulanacak KDV oranı ve varsa iskonto.',
                    ] },
                ],
            },
            {
                h: '2. Faturanın biçimine karar verin: kağıt, e-Fatura veya e-Arşiv',
                blocks: [
                    'Türkiye\'de faturanın hangi biçimde düzenleneceği sizin ve alıcınızın durumuna bağlıdır.',
                    { ul: [
                        'e-Fatura: Hem siz hem alıcınız e-Fatura sistemine kayıtlıysanız fatura Gelir İdaresi Başkanlığı (GİB) üzerinden elektronik olarak düzenlenip iletilir.',
                        'e-Arşiv fatura: Siz e-Fatura sistemine kayıtlı olduğunuz hâlde alıcınız kayıtlı değilse (örneğin bir tüketici), faturayı e-Arşiv olarak düzenler ve e-posta ya da çıktı olarak verirsiniz.',
                        'Kağıt fatura: Elektronik sisteme geçme zorunluluğu olmayan mükellefler, anlaşmalı matbaada bastırılmış seri ve sıra numaralı fatura kullanabilir.',
                    ] },
                    'Hangi gruba girdiğinizden emin değilseniz mali müşavirinize veya GİB\'in e-Fatura kayıtlı kullanıcılar listesine bakın. Ayrıntılar için e-Fatura ve e-Arşiv farkını anlattığımız rehbere göz atabilirsiniz.',
                ],
            },
            {
                h: '3. Faturayı adım adım doldurun',
                blocks: [
                    { ol: [
                        'Fatura tarihini ve numarasını yazın. Numaralar sıralı ve tekrarsız olmalıdır.',
                        'Satıcı (siz) ve alıcı bilgilerini girin.',
                        'Her mal veya hizmet için ayrı satır açın: açıklama, miktar, birim fiyat ve satır tutarı.',
                        'KDV oranını seçin ve KDV tutarını ayrı bir satırda gösterin. Türkiye\'de genel oran %20, indirimli oranlar %10 ve %1\'dir.',
                        'Ara toplamı, KDV\'yi ve genel toplamı yazın. Uygulamada genel toplamın yazıyla da belirtilmesi yaygındır.',
                        'Gerekiyorsa ödeme koşullarını ve banka (IBAN) bilgilerinizi ekleyin.',
                        'Faturayı alıcıya iletin ve bir nüshasını saklayın.',
                    ] },
                    'Odivon FaturaPro\'da bu adımların tamamı tek bir formda yapılır: ülkeyi Türkiye seçtiğinizde KDV oranları ve TL hazır gelir, toplamlar otomatik hesaplanır ve faturayı PDF olarak indirebilirsiniz.',
                ],
            },
            {
                h: '4. Süreye dikkat edin',
                blocks: [
                    'Vergi Usul Kanunu\'na göre fatura, malın teslim edildiği veya hizmetin yapıldığı tarihten itibaren en geç 7 gün içinde düzenlenmelidir. Bu süre aşılırsa fatura hiç düzenlenmemiş sayılır ve özel usulsüzlük cezası söz konusu olur. Konunun ayrıntıları fatura düzenleme süresi rehberimizde.',
                ],
            },
            {
                h: '5. Faturayı saklayın',
                blocks: [
                    'Düzenlediğiniz ve aldığınız faturaları, ilgili oldukları yılı izleyen yılın başından itibaren 5 yıl boyunca saklamanız gerekir. e-Fatura ve e-Arşiv faturalar elektronik ortamda saklanır; kağıt faturaların asıl veya suret nüshaları düzenli biçimde dosyalanmalıdır.',
                ],
            },
            {
                h: 'Sık yapılan hatalar',
                blocks: [
                    { ul: [
                        'Alıcının vergi numarasını veya unvanını yanlış yazmak.',
                        'KDV dahil fiyatı KDV hariçmiş gibi girip KDV\'yi iki kez eklemek.',
                        'Fatura numaralarını atlamak veya aynı numarayı iki kez kullanmak.',
                        'Faturayı 7 günlük süreden sonra kesmek.',
                        'e-Fatura mükellefi olan bir alıcıya e-Arşiv fatura düzenlemek.',
                    ] },
                ],
            },
        ],
        faq: [
            { q: 'Şahıs olarak fatura kesebilir miyim?', a: 'Fatura kesebilmek için vergi mükellefiyetinizin (şahıs şirketi veya serbest meslek kaydı) olması gerekir. Serbest meslek erbabı fatura yerine serbest meslek makbuzu düzenler.' },
            { q: 'Faturada KDV ayrı gösterilmek zorunda mı?', a: 'Evet. KDV mükellefleri düzenledikleri faturada hesaplanan KDV\'yi mal veya hizmet bedelinden ayrı olarak göstermelidir.' },
            { q: 'Odivon ile hazırladığım fatura resmi e-Fatura yerine geçer mi?', a: 'Hayır. Odivon FaturaPro faturayı hazırlamanıza ve PDF olarak almanıza yardımcı olur; e-Fatura veya e-Arşiv mükellefiyseniz faturayı GİB\'e bağlı bir sistem üzerinden de düzenlemeniz gerekir.' },
        ],
    },

    'proforma-fatura-nedir': {
        intro: [
            'Proforma fatura, bir satış gerçekleşmeden önce alıcıya gönderilen ve satışın koşullarını gösteren ön faturadır. Görünüşü normal bir faturaya benzer, ancak hukuki ve vergisel açıdan bir teklif niteliğindedir.',
            'Bu yazıda proforma faturanın ne işe yaradığını, normal faturadan farkını ve hazırlarken nelere dikkat etmeniz gerektiğini anlatıyoruz.',
        ],
        sections: [
            {
                h: 'Proforma fatura ne işe yarar?',
                blocks: [
                    { ul: [
                        'Alıcının satın alma kararından önce fiyatı, miktarı ve koşulları net olarak görmesini sağlar.',
                        'Alıcının kendi şirketinde ödeme onayı veya bütçe onayı almasında kullanılır.',
                        'İhracatta akreditif açılması, ithalat izni veya bazı gümrük ön işlemleri için istenebilir.',
                        'Ön ödemeli (peşin) satışlarda alıcıya ne kadar ödeme yapacağını bildirir.',
                    ] },
                ],
            },
            {
                h: 'Proforma fatura ile normal fatura arasındaki farklar',
                blocks: [
                    { ul: [
                        'Proforma fatura bir vergi belgesi değildir; muhasebe kayıtlarına gelir veya gider olarak işlenmez.',
                        'Proforma fatura KDV doğurmaz ve KDV beyannamesine girmez. Satış gerçekleştiğinde ayrıca normal fatura düzenlenir.',
                        'Normal faturanın 7 günlük düzenleme süresi proforma için geçerli değildir.',
                        'Proforma faturada belirtilen koşullar, alıcı kabul edene kadar bağlayıcı bir satış anlamına gelmez; çoğunlukla bir geçerlilik süresi yazılır.',
                    ] },
                ],
            },
            {
                h: 'Proforma faturada hangi bilgiler bulunmalı?',
                blocks: [
                    'Proforma için yasal bir şablon yoktur, ancak alıcının karar verebilmesi için şu bilgilerin yer alması önerilir:',
                    { ul: [
                        'Belgenin üzerinde açıkça "Proforma Fatura" ibaresi.',
                        'Satıcı ve alıcı bilgileri.',
                        'Proforma numarası ve düzenleme tarihi.',
                        'Ürün veya hizmetlerin tanımı, miktarı, birim fiyatı ve toplamı.',
                        'Uygulanacak KDV oranı ve tahmini KDV tutarı.',
                        'Para birimi, ödeme koşulları ve banka bilgileri.',
                        'Teslim şekli ve süresi (ihracatta teslim şekli, örneğin EXW veya FOB).',
                        'Teklifin geçerlilik süresi.',
                    ] },
                ],
            },
            {
                h: 'Proforma faturadan gerçek faturaya geçiş',
                blocks: [
                    'Alıcı proformayı onaylayıp mal teslim edildiğinde veya hizmet tamamlandığında normal fatura düzenlenir. Bu faturadaki tutarlar proformadakiyle aynı olabileceği gibi miktar veya fiyat değişikliklerine göre farklılaşabilir. Ön ödeme alındıysa bu durum faturada ayrıca belirtilebilir.',
                    'Odivon FaturaPro\'da fatura formunda belge türü olarak proforma seçebilir, satış kesinleştiğinde aynı bilgilerle satış faturasını hazırlayabilirsiniz.',
                ],
            },
        ],
        faq: [
            { q: 'Proforma fatura ile ödeme alınabilir mi?', a: 'Evet, alıcı proformadaki tutarı ön ödeme olarak yatırabilir. Ancak mal teslimi veya hizmet tamamlandığında normal fatura düzenlenmesi gerekir.' },
            { q: 'Proforma fatura gider olarak yazılır mı?', a: 'Hayır. Proforma bir vergi belgesi olmadığı için gider veya KDV indirimi için kullanılamaz.' },
            { q: 'Proforma fatura ile teklif aynı şey mi?', a: 'Amaçları benzerdir. Proforma, faturaya çok yakın bir biçimde düzenlenen ayrıntılı bir tekliftir ve özellikle dış ticarette resmi işlemler için tercih edilir.' },
        ],
    },

    'e-fatura-e-arsiv-farki': {
        intro: [
            'e-Fatura ve e-Arşiv fatura, ikisi de elektronik ortamda düzenlenen ve kağıt faturayla aynı hukuki niteliğe sahip belgelerdir. Aralarındaki temel fark, faturanın kime düzenlendiği ve alıcıya nasıl ulaştırıldığıdır.',
        ],
        sections: [
            {
                h: 'e-Fatura nedir?',
                blocks: [
                    'e-Fatura, e-Fatura sistemine kayıtlı iki mükellef arasında düzenlenen faturadır. Fatura, Gelir İdaresi Başkanlığı (GİB) altyapısı üzerinden doğrudan alıcının sistemine iletilir; çıktı alınması veya e-posta ile gönderilmesi gerekmez.',
                    'e-Fatura iki senaryoyla düzenlenebilir:',
                    { ul: [
                        'Temel senaryo: Fatura alıcıya ulaştığı anda geçerlidir; alıcı sistem üzerinden reddedemez.',
                        'Ticari senaryo: Alıcı faturayı belirli süre içinde sistem üzerinden kabul veya reddedebilir.',
                    ] },
                ],
            },
            {
                h: 'e-Arşiv fatura nedir?',
                blocks: [
                    'e-Arşiv fatura, e-Fatura mükellefi olan bir satıcının e-Fatura sistemine kayıtlı olmayan alıcılara (tüketiciler veya kayıtlı olmayan işletmeler) düzenlediği elektronik faturadır. Alıcıya e-posta ile ya da kağıt çıktı olarak iletilir ve faturanın bilgileri GİB\'e raporlanır.',
                    'İnternet üzerinden satış yapanlar için e-Arşiv faturanın elektronik olarak iletilmesi ayrıca zorunludur.',
                ],
            },
            {
                h: 'Karşılaştırma',
                blocks: [
                    { ul: [
                        'Alıcı: e-Fatura yalnızca kayıtlı mükelleflere; e-Arşiv ise kayıtlı olmayan herkese düzenlenir.',
                        'İletim: e-Fatura GİB üzerinden alıcının sistemine; e-Arşiv e-posta veya çıktı ile iletilir.',
                        'Ret ve itiraz: e-Faturada ticari senaryoda sistem üzerinden ret mümkündür; e-Arşivde iptal satıcı tarafından yapılır.',
                        'Saklama: İkisi de elektronik ortamda saklanır.',
                    ] },
                ],
            },
            {
                h: 'Kimler e-Fatura ve e-Arşive geçmek zorunda?',
                blocks: [
                    'GİB, belirli bir yıllık brüt satış hasılatını aşan mükellefleri e-Fatura sistemine geçmekle yükümlü tutar. Bu eşik yıllar içinde kademeli olarak düşürülmüştür. Ayrıca internetten satış yapanlar, gayrimenkul ve motorlu araç alım satımı yapanlar gibi bazı sektörler cirodan bağımsız olarak kapsama alınmıştır. e-Fatura mükellefi olanlar, kayıtlı olmayan alıcılara kestikleri faturalar için e-Arşiv sistemini de kullanır.',
                    'Güncel eşik ve sektör listesi her yıl değişebileceği için kendi durumunuzu GİB duyurularından veya mali müşavirinizden kontrol edin.',
                ],
            },
            {
                h: 'Alıcının e-Fatura mükellefi olup olmadığını nasıl anlarım?',
                blocks: [
                    'GİB\'in e-Fatura kayıtlı kullanıcılar listesinde alıcının vergi numarasıyla arama yapabilirsiniz. Kullandığınız entegratör veya muhasebe programı da bu kontrolü fatura düzenlerken otomatik yapar. Kayıtlı bir alıcıya e-Arşiv fatura düzenlemek hatalı belge düzenlemek anlamına gelir.',
                ],
            },
            {
                h: 'Odivon FaturaPro nerede devreye girer?',
                blocks: [
                    'Odivon FaturaPro bir GİB özel entegratörü değildir. Kağıt fatura kullanan veya yurt dışına fatura kesen işletmeler faturalarını Odivon ile hazırlayıp PDF olarak gönderebilir. e-Fatura veya e-Arşiv mükellefiyseniz resmi faturanızı GİB\'e bağlı bir sistem üzerinden düzenlemeniz gerekir.',
                ],
            },
        ],
        faq: [
            { q: 'e-Arşiv fatura ile e-Fatura aynı şey mi?', a: 'Hayır. İkisi de elektronik faturadır ama e-Fatura kayıtlı mükellefler arasında GİB üzerinden iletilir; e-Arşiv ise kayıtlı olmayan alıcılara e-posta veya çıktı ile verilir.' },
            { q: 'e-Fatura mükellefi olmayan biri e-Arşiv düzenleyebilir mi?', a: 'e-Arşiv uygulaması, e-Fatura sistemine kayıtlı mükelleflerin kayıtlı olmayan alıcılara düzenlediği faturalar içindir. GİB portalı üzerinden gönüllü olarak da sisteme geçilebilir.' },
            { q: 'e-Arşiv faturanın çıktısı alınmalı mı?', a: 'Alıcı isterse çıktı verilebilir; internet satışlarında ise e-Arşiv faturanın elektronik olarak iletilmesi zorunludur.' },
        ],
    },

    'kdv-nasil-hesaplanir': {
        intro: [
            'Katma Değer Vergisi (KDV), mal ve hizmet satışlarında fiyatın üzerine eklenen ve satıcının devlete aktardığı bir vergidir. Fatura keserken en sık yapılan hata, KDV dahil ile KDV hariç tutarları karıştırmaktır.',
            'Bu rehberde iki temel hesabı, güncel oranları ve örnekleri bulacaksınız. Hesabı hızlıca yapmak için ücretsiz KDV hesaplama aracımızı da kullanabilirsiniz.',
        ],
        sections: [
            {
                h: 'Türkiye\'de güncel KDV oranları',
                blocks: [
                    { ul: [
                        '%20: Genel oran. Mal ve hizmetlerin çoğu bu orana tabidir.',
                        '%10: Bazı gıda ürünleri, otel konaklaması gibi indirimli orana tabi mal ve hizmetler.',
                        '%1: Bazı temel gıda ürünleri gibi sınırlı sayıda mal ve hizmet.',
                    ] },
                    'Hangi ürünün hangi orana girdiği KDV Kanunu\'na ekli listelerle belirlenir. Bu oranlar Temmuz 2023\'ten beri geçerlidir; değişiklik olursa GİB duyurularından takip edin.',
                ],
            },
            {
                h: 'KDV hariç tutara KDV eklemek',
                blocks: [
                    'Formül: KDV dahil tutar = KDV hariç tutar × (1 + KDV oranı)',
                    'Örnek: 1.000 TL\'lik bir hizmete %20 KDV eklenecek. 1.000 × 0,20 = 200 TL KDV. KDV dahil tutar 1.000 + 200 = 1.200 TL olur.',
                ],
            },
            {
                h: 'KDV dahil tutardan KDV\'yi ayırmak',
                blocks: [
                    'Formül: KDV hariç tutar = KDV dahil tutar ÷ (1 + KDV oranı). KDV tutarı = KDV dahil tutar − KDV hariç tutar.',
                    'Örnek: Müşteriye 1.200 TL (KDV dahil) fiyat verdiniz ve oran %20. 1.200 ÷ 1,20 = 1.000 TL matrah, 1.200 − 1.000 = 200 TL KDV.',
                    'Sık yapılan hata: 1.200 × 0,20 = 240 TL hesaplamak. KDV dahil tutar zaten KDV\'yi içerdiği için oranla doğrudan çarpmak yanlış sonuç verir.',
                ],
            },
            {
                h: 'Farklı oranlar içeren faturalar',
                blocks: [
                    'Bir faturada farklı oranlara tabi kalemler varsa KDV her oran için ayrı hesaplanır ve faturada oran bazında gösterilir. Örneğin %10 oranlı 500 TL ve %20 oranlı 1.000 TL kalem için KDV 50 + 200 = 250 TL, toplam 1.750 TL olur.',
                ],
            },
            {
                h: 'İskonto varsa KDV nasıl hesaplanır?',
                blocks: [
                    'Faturada gösterilen iskonto, KDV hesaplanmadan önce matrahtan düşülür. 1.000 TL\'lik satışta %10 iskonto uygulanırsa matrah 900 TL, %20 KDV 180 TL, toplam 1.080 TL olur.',
                ],
            },
        ],
        faq: [
            { q: 'KDV dahil fiyattan KDV nasıl çıkarılır?', a: 'KDV dahil tutarı (1 + oran) ile bölün. %20 için 1,20\'ye bölmek KDV hariç tutarı verir; aradaki fark KDV\'dir.' },
            { q: 'Yuvarlama nasıl yapılır?', a: 'KDV tutarı genellikle kuruş hassasiyetinde (iki ondalık) yuvarlanır. Çok kalemli faturalarda satır bazında ve toplamda yuvarlama farkı oluşabilir; muhasebe programınızın kuralını tutarlı kullanın.' },
            { q: 'Yurt dışına kesilen faturada KDV olur mu?', a: 'Hizmet ihracatı ve mal ihracatı belirli şartlarla KDV\'den istisnadır. Ayrıntılar için yurt dışına fatura kesme rehberimize bakın.' },
        ],
    },

    'faturada-bulunmasi-gereken-bilgiler': {
        intro: [
            'Bir belgenin fatura olarak kabul edilebilmesi için Vergi Usul Kanunu\'nun (VUK) 230. maddesinde sayılan bilgileri içermesi gerekir. Eksik bilgiyle düzenlenen fatura hem sizin hem alıcınızın vergi işlemlerinde sorun çıkarabilir.',
        ],
        sections: [
            {
                h: 'VUK 230. maddeye göre zorunlu bilgiler',
                blocks: [
                    { ol: [
                        'Faturanın düzenlenme tarihi, seri ve sıra numarası.',
                        'Faturayı düzenleyenin adı, varsa ticaret unvanı, iş adresi, bağlı olduğu vergi dairesi ve hesap (vergi kimlik) numarası.',
                        'Alıcının adı, ticaret unvanı, adresi ve varsa vergi dairesi ile hesap numarası.',
                        'Malın veya işin nevi (cinsi), miktarı, fiyatı ve tutarı.',
                        'Satılan malların teslim tarihi ve irsaliye numarası (irsaliyeli fatura kullanılmıyorsa ve sevk irsaliyesi düzenlendiyse).',
                    ] },
                    'Bunlara ek olarak, KDV mükellefleri hesapladıkları KDV\'yi faturada ayrıca göstermek zorundadır. Kağıt faturalarda matbaa bilgileri ve faturanın Maliye Bakanlığı ile anlaşmalı bir matbaada basıldığı da belge üzerinde yer alır.',
                ],
            },
            {
                h: 'Uygulamada eklenmesi önerilen bilgiler',
                blocks: [
                    { ul: [
                        'Ödeme vadesi ve ödeme şekli.',
                        'Banka hesap bilgileri (IBAN).',
                        'Genel toplamın yazıyla gösterimi.',
                        'İskonto, tevkifat veya istisna varsa açıklaması ve dayanağı.',
                        'Sipariş veya sözleşme numarası.',
                    ] },
                ],
            },
            {
                h: 'Alıcı tüketici ise',
                blocks: [
                    'Fatura bir tüketiciye düzenleniyorsa alıcının vergi numarası yoktur; adı soyadı ve adresi yazılır. e-Arşiv faturalarda tüketicinin T.C. kimlik numarası da istenebilir; bilinmiyorsa sistemlerin kabul ettiği genel numara kullanılabilir.',
                ],
            },
            {
                h: 'Eksik veya hatalı bilgi olursa ne olur?',
                blocks: [
                    'Zorunlu bilgilerden birinin eksik olması, faturanın usule aykırı düzenlendiği anlamına gelir ve özel usulsüzlük cezasına konu olabilir. Alıcı açısından da hatalı fatura gider veya KDV indirimi için sorun yaratır. Fark edilen hatalar için faturanın iptali veya düzeltici belge düzenlenmesi gerekir; bu konuyu fatura iptali rehberimizde anlattık.',
                ],
            },
            {
                h: 'Odivon FaturaPro ile eksiksiz fatura',
                blocks: [
                    'Odivon FaturaPro\'da Türkiye\'yi seçtiğinizde form, VUK 230\'da istenen satıcı ve alıcı alanlarını, satır bilgilerini ve KDV dökümünü içerecek şekilde hazırlanır. Firma bilgilerinizi bir kez kaydettiğinizde sonraki faturalarda tekrar yazmanız gerekmez.',
                ],
            },
        ],
        faq: [
            { q: 'Faturada imza zorunlu mu?', a: 'VUK 230 imzayı zorunlu bilgiler arasında saymaz. Kağıt faturalarda kaşe ve imza uygulamada yaygındır; e-Fatura ve e-Arşiv faturada mali mühür veya elektronik imza kullanılır.' },
            { q: 'Fatura numarası nasıl olmalı?', a: 'Numaralar seri ve sıra numarası şeklinde, kesintisiz ve tekrarsız ilerlemelidir. e-Fatura ve e-Arşivde numara formatı sistem tarafından belirlenir.' },
            { q: 'Yabancı dilde fatura düzenlenebilir mi?', a: 'Yurt dışındaki müşterilere düzenlenen faturalarda Türkçe ile birlikte yabancı dil kullanmak yaygındır. Defter kayıtları ve vergi incelemesi açısından Türkçe karşılıkların bulunması önerilir.' },
        ],
    },

    'kdv-tevkifati-nedir': {
        intro: [
            'KDV tevkifatı, faturada hesaplanan KDV\'nin bir kısmının veya tamamının satıcı yerine alıcı tarafından vergi dairesine beyan edilip ödenmesidir. Amaç, vergi kaybı riskinin yüksek olduğu sektörlerde KDV\'nin tahsilatını güvence altına almaktır.',
        ],
        sections: [
            {
                h: 'Tevkifat nasıl çalışır?',
                blocks: [
                    'Normalde satıcı, faturada gösterdiği KDV\'nin tamamını alıcıdan tahsil eder ve kendi beyannamesiyle öder. Tevkifatlı işlemde ise alıcı, KDV\'nin belirlenen kısmını satıcıya ödemez; bu kısmı kendi adına "2 No.lu KDV Beyannamesi" ile beyan edip vergi dairesine yatırır. Satıcıya yalnızca kalan KDV ödenir.',
                ],
            },
            {
                h: 'Oranlar nasıl okunur?',
                blocks: [
                    'Tevkifat oranları onda bir cinsinden ifade edilir. 9/10, KDV\'nin onda dokuzunun alıcı tarafından ödeneceğini; 4/10 ise onda dördünün alıcıya, onda altısının satıcıya kalacağını gösterir. Tam tevkifatta KDV\'nin tamamı alıcı tarafından beyan edilir.',
                    'Örneğin yapım işlerinde 4/10, işgücü temin hizmetlerinde 9/10 oranları uygulanır. Hangi işte hangi oranın geçerli olduğu KDV Genel Uygulama Tebliği\'nde sayılmıştır ve zaman zaman güncellenir.',
                ],
            },
            {
                h: 'Örnek hesap',
                blocks: [
                    '10.000 TL\'lik, %20 KDV\'ye ve 9/10 tevkifata tabi bir hizmet düşünelim:',
                    { ul: [
                        'Hesaplanan KDV: 10.000 × 0,20 = 2.000 TL.',
                        'Tevkif edilen KDV (alıcı öder): 2.000 × 9/10 = 1.800 TL.',
                        'Satıcıya ödenecek KDV: 2.000 − 1.800 = 200 TL.',
                        'Alıcının satıcıya ödeyeceği toplam: 10.000 + 200 = 10.200 TL.',
                    ] },
                ],
            },
            {
                h: 'Kimler tevkifat uygular?',
                blocks: [
                    'Tevkifatı uygulamakla sorumlu olan taraf alıcıdır. Kamu kurumları, belirli büyüklükteki işletmeler ve KDV mükellefleri, tebliğde sayılan işler için tevkifat uygular. Alıcı tüketiciyse veya sorumlu tutulmamışsa tevkifat yapılmaz. Ayrıca kısmi tevkifat, tebliğde belirtilen tutarın altındaki işlemlerde uygulanmaz; güncel tutarı mali müşavirinizden teyit edin.',
                ],
            },
            {
                h: 'Faturada nasıl gösterilir?',
                blocks: [
                    'Tevkifatlı faturada mal veya hizmet bedeli, hesaplanan KDV, tevkif edilen KDV ve satıcıya ödenecek KDV ayrı ayrı gösterilir. Tevkifat oranı (ör. 9/10) ve işlemin türü de belirtilir. e-Faturada her tevkifat türünün bir kodu vardır ve fatura bu kodla düzenlenir.',
                ],
            },
        ],
        faq: [
            { q: 'Tevkifatı kim beyan eder?', a: 'Tevkif edilen KDV\'yi alıcı, 2 No.lu KDV Beyannamesi ile beyan eder ve öder. Satıcı yalnızca kendisine ödenen KDV kısmını beyan eder.' },
            { q: 'Tevkifat satıcının zararına mı?', a: 'Hayır, KDV\'nin toplam tutarı değişmez; yalnızca kimin ödediği değişir. Ancak satıcı tahsil edemediği KDV nedeniyle KDV iadesi talep etmek durumunda kalabilir.' },
            { q: 'Tüketiciye kesilen faturada tevkifat olur mu?', a: 'Hayır. Tevkifat yükümlülüğü, tebliğde sorumlu tutulan alıcılar için geçerlidir.' },
        ],
    },

    'serbest-meslek-makbuzu': {
        intro: [
            'Serbest meslek makbuzu (SMM), serbest meslek erbabının verdiği hizmet karşılığında aldığı ücreti belgelemek için düzenlediği belgedir. Avukatlar, mali müşavirler, doktorlar, mühendisler, mimarlar, tasarımcılar ve kendi adına çalışan yazılımcılar gibi serbest meslek kaydı olan kişiler fatura yerine serbest meslek makbuzu düzenler.',
        ],
        sections: [
            {
                h: 'Serbest meslek makbuzu ile fatura arasındaki farklar',
                blocks: [
                    { ul: [
                        'Fatura, ticari faaliyet (mal satışı veya ticari hizmet) için; serbest meslek makbuzu ise serbest meslek faaliyeti için düzenlenir.',
                        'Serbest meslek makbuzu, ücretin tahsil edildiği anda düzenlenir; fatura ise teslimden itibaren 7 gün içinde.',
                        'Serbest meslek makbuzunda, alıcı bir işletmeyse gelir vergisi stopajı gösterilir.',
                    ] },
                ],
            },
            {
                h: 'Stopaj ve KDV hesabı',
                blocks: [
                    'Hizmeti alan taraf vergi kesintisi yapmakla sorumlu bir işletme ise, brüt ücret üzerinden %20 gelir vergisi stopajı keser ve bunu serbest meslek erbabı adına vergi dairesine öder. KDV ise brüt ücret üzerinden ayrıca hesaplanır.',
                    'Örnek: Brüt ücret 10.000 TL, KDV oranı %20.',
                    { ul: [
                        'KDV: 10.000 × 0,20 = 2.000 TL.',
                        'Gelir vergisi stopajı: 10.000 × 0,20 = 2.000 TL.',
                        'Net tahsil edilen tutar: 10.000 + 2.000 − 2.000 = 10.000 TL.',
                    ] },
                    'Hizmet bir tüketiciye (nihai kişiye) verilirse stopaj yapılmaz; tahsil edilen tutar brüt ücret ile KDV\'nin toplamıdır.',
                ],
            },
            {
                h: 'e-Serbest Meslek Makbuzu (e-SMM)',
                blocks: [
                    'Serbest meslek erbabı için e-SMM uygulaması zorunludur; makbuzlar GİB\'in e-SMM sistemi veya özel entegratörler üzerinden elektronik olarak düzenlenir ve alıcıya e-posta ile iletilir. Kağıt makbuz kullanımı istisnai durumlarla sınırlıdır.',
                ],
            },
            {
                h: 'Yurt dışındaki müşteriye hizmet veren serbest meslek erbabı',
                blocks: [
                    'Yurt dışındaki bir müşteriye verilen ve yurt dışında yararlanılan hizmetler hizmet ihracatı sayılabilir ve KDV\'den istisna olabilir. Yabancı müşteri Türkiye\'de stopaj sorumlusu olmadığı için stopaj da uygulanmaz. Bu durumda makbuzda istisna açıklaması yer alır; ayrıntılar için yurt dışına fatura kesme rehberimize bakın.',
                ],
            },
        ],
        faq: [
            { q: 'Serbest meslek erbabı fatura kesebilir mi?', a: 'Serbest meslek faaliyeti için belge serbest meslek makbuzudur. Aynı kişi ayrıca ticari faaliyette bulunuyorsa o faaliyet için fatura düzenler.' },
            { q: 'Stopajı kim öder?', a: 'Hizmeti alan işletme, brüt ücretten stopajı keserek muhtasar beyanname ile vergi dairesine öder. Serbest meslek erbabı bu tutarı yıllık beyannamesinde mahsup eder.' },
            { q: 'Makbuz ne zaman düzenlenir?', a: 'Ücretin tahsil edildiği anda. Tahsilat yapılmadan makbuz düzenlenmesi zorunlu değildir.' },
        ],
    },

    'fatura-duzenleme-suresi': {
        intro: [
            'Faturanın ne zaman kesileceği Vergi Usul Kanunu\'nda açıkça belirlenmiştir. Süreyi kaçırmak, faturanın hiç düzenlenmemiş sayılması ve ceza ile sonuçlanabilir.',
        ],
        sections: [
            {
                h: '7 gün kuralı',
                blocks: [
                    'VUK\'un 231. maddesine göre fatura, malın teslimi veya hizmetin yapıldığı tarihten itibaren en geç 7 gün içinde düzenlenmelidir. Bu süre içinde düzenlenmeyen fatura hiç düzenlenmemiş sayılır.',
                ],
            },
            {
                h: 'Süre nasıl sayılır?',
                blocks: [
                    { ul: [
                        'Süre, malın teslim edildiği veya hizmetin tamamlandığı günü izleyen günden itibaren takvim günü olarak sayılır; hafta sonları ve tatiller de süreye dahildir.',
                        'Sevk irsaliyesi ile teslim edilen mallarda süre, malın teslim (sevk) tarihinden başlar.',
                        'Kısım kısım yapılan hizmetlerde, her kısmın tamamlandığı tarih esas alınabilir; sözleşmenin yapısına göre değerlendirilir.',
                        'Teslimden önce fatura düzenlemek mümkündür; süre kuralı yalnızca geç düzenlemeyi sınırlar.',
                    ] },
                ],
            },
            {
                h: 'e-Fatura ve e-Arşivde de geçerli mi?',
                blocks: [
                    'Evet. 7 günlük süre, faturanın biçiminden bağımsız olarak geçerlidir. e-Arşiv faturaların ayrıca GİB\'e belirli süreler içinde raporlanması gerekir; bu raporlama genellikle kullandığınız entegratör tarafından otomatik yapılır.',
                ],
            },
            {
                h: 'Süre aşılırsa ne olur?',
                blocks: [
                    'Süresinde düzenlenmeyen fatura hiç düzenlenmemiş sayıldığı için, fatura düzenlememe veya almama durumunda öngörülen özel usulsüzlük cezası (VUK 353) uygulanabilir. Bu ceza hem faturayı vermeyen satıcıya hem de faturayı almayan alıcıya kesilebilir. Ceza tutarları her yıl yeniden değerleme oranında güncellenir.',
                ],
            },
            {
                h: 'Süreyi kaçırmamak için öneriler',
                blocks: [
                    { ul: [
                        'Teslim veya hizmet tamamlandığı gün faturayı hazırlamayı alışkanlık hâline getirin.',
                        'Tekrarlayan hizmetler için aynı bilgileri kullanan şablon faturalar oluşturun.',
                        'Bekleyen faturaları haftalık olarak kontrol edin.',
                    ] },
                    'Odivon FaturaPro\'da müşteri bilgilerinizi kaydedip birkaç dakikada fatura hazırlayabilir, faturalarınızı tek bir listeden takip edebilirsiniz.',
                ],
            },
        ],
        faq: [
            { q: 'Fatura kaç gün içinde kesilmeli?', a: 'Malın teslimi veya hizmetin yapıldığı tarihten itibaren en geç 7 gün içinde.' },
            { q: '7 günlük sürede hafta sonu sayılır mı?', a: 'Evet, süre takvim günü olarak sayılır.' },
            { q: 'Ödeme alınmadan fatura kesilir mi?', a: 'Evet. Fatura düzenleme yükümlülüğü ödemeye değil teslime veya hizmetin yapılmasına bağlıdır. Serbest meslek makbuzu ise tahsilatta düzenlenir.' },
        ],
    },

    'yurt-disina-fatura-kesme': {
        intro: [
            'Yurt dışındaki bir müşteriye mal satıyor veya hizmet veriyorsanız faturanızda KDV, para birimi ve dil konusunda dikkat etmeniz gereken kurallar vardır. Bu rehberde Türkiye\'deki bir işletmenin yurt dışına fatura keserken bilmesi gerekenleri özetliyoruz.',
        ],
        sections: [
            {
                h: 'Hizmet ihracatında KDV istisnası',
                blocks: [
                    'KDV Kanunu\'nun 11/1-a ve 12/2. maddelerine göre, yurt dışındaki bir müşteri için yapılan ve yurt dışında yararlanılan hizmetler KDV\'den istisnadır. Yazılım geliştirme, tasarım, danışmanlık ve çeviri gibi hizmetler bu kapsamda değerlendirilebilir.',
                    'İstisnadan yararlanmak için:',
                    { ul: [
                        'Müşterinin yurt dışında yerleşik olması,',
                        'Hizmetten yurt dışında yararlanılması,',
                        'Hizmet bedelinin faturada gösterilmesi gerekir.',
                    ] },
                    'Faturada KDV hesaplanmaz ve istisna açıklaması (ör. "3065 sayılı KDV Kanunu 11/1-a maddesi uyarınca KDV\'den istisnadır") yazılır.',
                ],
            },
            {
                h: 'Mal ihracatı',
                blocks: [
                    'Yurt dışına mal satışında fatura, gümrük beyannamesi ile birlikte işlem görür ve mal ihracatı da KDV\'den istisnadır. e-Fatura mükellefleri ihracat faturalarını e-Fatura sisteminin ihracat senaryosuyla düzenler. Küçük tutarlı e-ticaret gönderilerinde (mikro ihracat) basitleştirilmiş usuller uygulanır.',
                ],
            },
            {
                h: 'Döviz cinsinden fatura',
                blocks: [
                    'Yurt dışına fatura euro, dolar veya sterlin gibi yabancı para cinsinden düzenlenebilir. Vergi Usul Kanunu\'na göre dövizli tutarlar, kayıtlara Türk lirası karşılığıyla alınır; bunun için genellikle işlem tarihindeki T.C. Merkez Bankası döviz alış kuru kullanılır. Faturada kur ve TL karşılığını belirtmek kayıtlarınızı kolaylaştırır.',
                ],
            },
            {
                h: 'Dil ve içerik',
                blocks: [
                    'Yabancı müşterinin faturayı anlayabilmesi için Türkçe ile birlikte İngilizce (çift dilli) fatura düzenlemek uygulamada en güvenli yoldur. Faturada şunlar bulunmalıdır:',
                    { ul: [
                        'Sizin bilgileriniz ve Türkiye vergi numaranız.',
                        'Müşterinin unvanı, adresi, ülkesi ve varsa kendi ülkesindeki vergi numarası (ör. AB\'de VAT numarası).',
                        'Hizmetin veya malın açık tanımı.',
                        'Para birimi, tutar ve ödeme bilgileri (IBAN, SWIFT/BIC kodu).',
                        'KDV istisnası açıklaması.',
                    ] },
                ],
            },
            {
                h: 'Müşterinin ülkesindeki kurallar',
                blocks: [
                    'Bazı ülkelerde alıcı, yurt dışından aldığı hizmet için kendi ülkesinde KDV\'yi beyan eder (ters ibraz / reverse charge). Bu durumda faturada "reverse charge" ibaresinin bulunması müşterinizin işini kolaylaştırır. Odivon FaturaPro\'daki ülke rehberlerinde Almanya, Fransa, İngiltere, ABD ve diğer ülkelerin vergi oranlarını ve fatura gerekliliklerini bulabilirsiniz.',
                ],
            },
        ],
        faq: [
            { q: 'Yurt dışına kesilen faturada KDV olur mu?', a: 'Yurt dışında yararlanılan hizmetler ve ihraç edilen mallar şartları sağlıyorsa KDV\'den istisnadır; faturada KDV hesaplanmaz, istisna maddesi yazılır.' },
            { q: 'Fatura euro veya dolar olarak kesilebilir mi?', a: 'Evet. Kayıtlarda TL karşılığı esas alınır; genellikle Merkez Bankası döviz alış kuru kullanılır.' },
            { q: 'Yurt dışı faturası İngilizce olabilir mi?', a: 'Müşteri için İngilizce kullanılabilir; Türkçe karşılıkların da bulunduğu çift dilli fatura önerilir.' },
        ],
    },

    'fatura-iptali-ve-iade-faturasi': {
        intro: [
            'Hatalı düzenlenen bir faturanın düzeltilmesi veya iade edilen bir malın belgelenmesi, faturanın biçimine (kağıt, e-Fatura, e-Arşiv) ve alıcının faturayı kayıtlarına alıp almadığına göre farklı yollarla yapılır.',
        ],
        sections: [
            {
                h: 'Kağıt faturanın iptali',
                blocks: [
                    'Kağıt fatura alıcıya verilmeden önce hata fark edilirse, tüm nüshaları üzerine "İptal" yazılarak ciltte bırakılır ve saklanır. Fatura alıcıya verildiyse, alıcıdan geri alınıp aynı şekilde iptal edilebilir. Alıcı faturayı kayıtlarına aldıysa iptal yerine düzeltici belge (iade faturası veya fiyat farkı faturası) düzenlenmesi gerekir.',
                ],
            },
            {
                h: 'e-Arşiv faturanın iptali',
                blocks: [
                    'e-Arşiv fatura, düzenleyen satıcı tarafından GİB portalı veya entegratör üzerinden iptal edilebilir. İptal işlemi de GİB\'e raporlanır. Alıcı tüketiciyse ve fatura e-posta ile gönderildiyse, iptal bilgisinin de alıcıya iletilmesi uygun olur.',
                ],
            },
            {
                h: 'e-Faturanın reddi ve iptali',
                blocks: [
                    { ul: [
                        'Ticari senaryo: Alıcı faturayı belirli süre içinde sistem üzerinden reddedebilir; reddedilen faturanın yerine doğrusu düzenlenir.',
                        'Temel senaryo: Fatura sistem üzerinden reddedilemez. Alıcı, faturayı aldığı tarihten itibaren 8 gün içinde GİB portalındaki itiraz bölümü, KEP (kayıtlı elektronik posta), noter veya taahhütlü posta ile itiraz ederek faturayı iptal ettirebilir.',
                        'Bu yollar kullanılamıyorsa veya süre geçtiyse, düzeltme iade faturası ile yapılır.',
                    ] },
                ],
            },
            {
                h: 'İade faturası nedir, kim keser?',
                blocks: [
                    'İade faturası, satın alınan malın satıcıya geri verildiğini belgeleyen faturadır ve malı iade eden alıcı tarafından düzenlenir. Alıcı, iade ettiği malı kendi adına satıcıya fatura etmiş olur; böylece satıcının satışı ve KDV\'si düzeltilir.',
                    'İade faturasında orijinal faturanın tarihi ve numarasına atıf yapılması, iade edilen miktar ve tutarın açıkça yazılması önerilir.',
                ],
            },
            {
                h: 'Alıcı tüketiciyse',
                blocks: [
                    'Tüketicilerin fatura düzenleme yükümlülüğü yoktur. Bu durumda iade, tüketicinin imzaladığı iade tutanağı veya satıcının iade işlemini belgeleyen kayıtlarıyla belgelenir. Uygulamanın ayrıntıları işletmenin durumuna göre değişebileceğinden mali müşavirinize danışın.',
                ],
            },
            {
                h: 'Fiyat farkı ve iskonto faturası',
                blocks: [
                    'Mal iade edilmeden yalnızca fiyatta değişiklik olduysa (ör. sonradan verilen iskonto veya fiyat hatası), satıcı fiyat farkı faturası düzenler ya da alıcı lehine iskonto faturası düzenlenir. Böylece asıl fatura iptal edilmeden tutar düzeltilir.',
                ],
            },
        ],
        faq: [
            { q: 'e-Fatura iptal süresi kaç gün?', a: 'Temel senaryodaki e-Faturaya alıcı, faturayı aldığı tarihten itibaren 8 gün içinde GİB portalı, KEP, noter veya taahhütlü posta ile itiraz edebilir.' },
            { q: 'İade faturasını kim keser?', a: 'Malı iade eden alıcı keser. Alıcı tüketiciyse iade, tutanak gibi belgelerle kayıt altına alınır.' },
            { q: 'Kayıtlara alınmış fatura iptal edilebilir mi?', a: 'Genellikle hayır. Bu durumda iade faturası, fiyat farkı faturası gibi düzeltici belgeler kullanılır.' },
        ],
    },
};
