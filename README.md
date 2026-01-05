# WhatsApp Wrapped 2025 (Next.js)

Yerelde çalışan, deterministik ve baskıya hazır bir "Wrapped 2025" rapor iskeleti. WhatsApp metin dökümü ve GSM arama verisinden özet istatistikler üretir, Next.js App Router ile PDF'e aktarır.

> **Önerilen Node sürümü:** 20 LTS. Daha yeni sürümlerde (22+) uyarı alabilirsiniz fakat geliştirme amacıyla çalışmaya devam eder.

## Kurulum

1. Bağımlılıkları yükleyin:

```bash
npm install
```

2. Gerekli giriş dosyalarını yerleştirin:
   - `config.json` (örnek):

```json
{
  "ownerName": "Murat",
  "partnerName": "Rümeysa",
  "partnerPhoneE164": "+905533642291",
  "timezone": "Europe/Istanbul",
  "year": 2025,
  "language": "tr"
}
```

   - **Yeni (tercih edilen)** `data/input/whatsapp/` klasörü: `_chat.txt` + medya dosyaları (IMG-*.jpg, VID-*.mp4, *.opus, *.webp ...)
   - **Geriye dönük** `data/input/whatsapp.txt` + `data/input/media/`
   - `data/input/gsm.xlsx` : GSM arama dökümü (opsiyonel)

> Hızlı kontrol: `npm run doctor` komutu Node/npm sürümünüzü ve `dist/` ile `data/` klasörlerine yazma izinlerini doğrular.

## Komutlar

- `npm run parse:whatsapp` — whatsapp.txt dosyasını `dist/messages.jsonl` olarak normalize eder.
- `npm run parse:gsm` — gsm.xlsx dosyasını `dist/gsm.json` özetine dönüştürür.
- `npm run render:assets` — baskı için placeholder wordcloud SVG üretir (`dist/assets/wordcloud.svg`).
- `npm run build:report` — yukarıdaki adımları çalıştırır ve `dist/report.json` dosyasını oluşturur.
- `npm run export:pdf` — Next.js build + Playwright ile `/report/2025` sayfasından PDF alır (`dist/wrapped_2025.pdf`).
- `npm run all` — raporu ve PDF'i uçtan uca üretir.
- `npm test` — WhatsApp satır parsere ait temel birim testleri.

## Tek tıkla üretim (UI)

- `/` ve `/report/2025` sayfalarındaki **Raporu Üret** butonu `npm run build:report` komutunu yerelde tetikler.
- İsteğe bağlı **PDF Üret** butonu `npm run export:pdf` komutunu çağırır.
- Güvenlik: sadece `NODE_ENV=development` veya `ENABLE_LOCAL_BUILD=1` iken çalışır; aksi hâlde API 403 döner.
- Yerelde çalıştırmak için `ENABLE_LOCAL_BUILD=1 npm run dev` komutunu kullanabilir ya da Windows'ta `start.bat` dosyasını çift tıklayabilirsiniz (değişken otomatik ayarlanır).
- Rapor üretimi tamamlanınca `/report/2025` otomatik yenilenir; hata durumunda kullanıcıya okunabilir mesaj gösterilir.

## Windows Quick Start

1. [Node.js 20 LTS](https://nodejs.org/) kurulu olduğundan emin olun (Node 22+ için sadece uyarı verilir).
2. Depoyu klonlayın ve `start.bat` dosyasını çift tıklayın ya da PowerShell'de çalıştırın.
   - Betik kendi dizinine geçer, `node_modules` yoksa `npm install` çalıştırır.
   - `ENABLE_LOCAL_BUILD=1` ve `NODE_ENV=development` otomatik set edilir; orchestrator erişim engeli kalkar.
   - Son adımda Next.js dev sunucusu çalışır ve tarayıcı `http://localhost:3000` adresini açar.
3. `data/input/` altına `_chat.txt` veya `whatsapp.txt`, gerekirse `gsm.xlsx` dosyalarını koyun; arayüzden **Raporu Oluştur** butonuna tıklayın.

PowerShell ile manuel başlatmak isterseniz:

```powershell
$env:ENABLE_LOCAL_BUILD="1"; $env:NEXT_PUBLIC_ENABLE_LOCAL_BUILD="1"; npm run dev
```

## Prod denemesi ve erişim ipuçları

- **Varsayılan davranış:** Prod build çalışırken orchestrator API kapalıdır ve `Orchestrator API erişimi reddedildi.` hatası 403 ile döner.
- **Bilinçli olarak açmak için:**
  - Windows CMD: `set ENABLE_LOCAL_BUILD=1 && npm run build && npm run start`
  - PowerShell: `$env:ENABLE_LOCAL_BUILD="1"; npm run build; npm run start`
- UI ve API aynı kontrolü paylaşır; bloklandığında arayüz "ENABLE_LOCAL_BUILD=1 ile çalıştırın veya npm run dev kullanın" ipucunu gösterir.
- Geliştirme modunda (`npm run dev`) bu ayar otomatik olarak etkin kabul edilir.

## Troubleshooting

- **MODULE_NOT_FOUND: ...\\node_modules\\tsx\\dist\\cli.js**
  - `npm install` komutunu çalıştırın veya `start.bat` betiğiyle otomatik yüklenmesini sağlayın. `tsx` artık devDependency olarak pakete dahil; ekstra kurulum gerektirmez.
- **Orchestrator API erişimi reddedildi.**
  - Geliştirme modunda çalıştığınızdan emin olun (`npm run dev` veya `start.bat`).
  - Manuel başlatırken `ENABLE_LOCAL_BUILD=1` ve gerekiyorsa `NEXT_PUBLIC_ENABLE_LOCAL_BUILD=1` ortam değişkenlerini set edin.
- **"Klasör açılamadı." (open-folder endpoint)**
  - Hedef klasörün var olduğundan ve Windows'ta `explorer.exe` erişilebilir olduğundan emin olun.
  - Erişim engeli devam ederse klasörü elle açabilir veya dosya izinlerini kontrol edebilirsiniz.

## Çıktılar

`dist/` klasöründe:
- `messages.jsonl`
- `gsm.json`
- `assets/wordcloud.svg`
- `report.json`
- `wrapped_2025.pdf` (PDF export başarıyla çalıştıysa)

## Tasarım & Baskı Notları
- A4 dikey sayfa, `app/globals.css` içinde @page tanımı.
- Her rapor sayfası `.page` sınıfı ile sınırlandırılmıştır.
- Gradient ve tipografi için Tailwind teması kullanıldı; font ailesi olarak Inter/sans-serif fallback.

## Test Fixtures
`data/fixtures` altında üç küçük WhatsApp örneği ve ilgili Vitest senaryoları bulunur. Parsere yeni biçimler eklerken bu fixture'ları genişletin.
