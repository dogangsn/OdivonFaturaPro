# iyzico Sandbox Kurulumu

Uygulama Checkout Form akışını Firebase Functions üzerinden kullanır. iyzico anahtarları Angular koduna veya `environment` dosyalarına eklenmez.

## Secret tanimlari

Firebase projesinin kokunde su komutlari calistirin:

```powershell
firebase functions:secrets:set IYZICO_API_KEY
firebase functions:secrets:set IYZICO_SECRET_KEY
firebase functions:secrets:set APP_URL
```

`APP_URL` degeri uygulamanin herkese acik adresidir. Ornegin `https://uygulama.example.com`.

Sandbox anahtarlari iyzico sandbox uye is yeri panelinden alinmalidir:

`https://sandbox-merchant.iyzipay.com/dashboard`

## Deploy

```powershell
firebase deploy --only functions,hosting
```

Functions URL'leri varsayilan olarak su formattadir:

`https://europe-west1-generateinvoiceweb.cloudfunctions.net`

Uygulama gelistirme ortaminda bu adresi `src/environments/environment.ts` icindeki `functionsBaseUrl` ile kullanir. Canli ortam adresi `environment.prod.ts` icindedir.

## Akis

1. `/pricing` sayfasinda Pro veya Kurumsal plan secilir.
2. Angular, Firebase ID token ile `initializeCheckoutForm` endpoint'ine istek atar.
3. Backend plani ve fiyati kendi sabitinden alir, iyzico Checkout Form oturumu baslatir.
4. Kullanici `paymentPageUrl` adresine yonlendirilir.
5. iyzico `iyzicoCallback` endpoint'ine doner.
6. Backend token ile Checkout Form sonucunu sorgular ve tutari kontrol eder.
7. Basarili odemede `users/{uid}` dokumani guncellenir ve kullanici uygulamaya yonlendirilir.

Sandbox test kart bilgileri iyzico dokumantasyonundaki guncel test kartlariyla kullanilmalidir. Canliya gecmeden once basarili, basarisiz, iptal ve callback tekrar denemesi senaryolari test edilmelidir.

## Uygulamada açma

Kartla ödeme düğmesi varsayılan olarak kapalıdır. Fonksiyonlar yayınlanıp sandbox testleri geçtikten sonra
`src/app/core/constants/business.constant.ts` içindeki `PAYMENTS.enabled` değerini `true` yapın.

## Canlıya geçiş

1. iyzico canlı üye iş yeri anahtarlarını `IYZICO_API_KEY` ve `IYZICO_SECRET_KEY` secret'larına yazın.
2. `functions/.env` dosyasına `IYZICO_BASE_URL=https://api.iyzipay.com` ekleyin.
3. Alıcı bilgileri (T.C. kimlik no, adres, telefon) şu an sandbox için sabit değerlerle gönderiliyor; canlıda kullanıcıdan alınmalıdır.
