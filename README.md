# WhatsApp Wrapped 2025 (Next.js)

Yerelde çalışan, deterministik ve baskıya hazır bir "Wrapped 2025" rapor iskeleti. WhatsApp metin dökümü ve GSM arama verisinden özet istatistikler üretir, Next.js App Router ile PDF'e aktarır.

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

1. [Node.js](https://nodejs.org/) kurulu olduğundan emin olun.
2. Depo kökünde `start.bat` dosyasını çift tıklayın.
   - `ENABLE_LOCAL_BUILD=1` ve `NODE_ENV=development` otomatik set edilir.
   - `node_modules` eksikse `npm install` çalışır.
   - `npm run dev` başlar; komut penceresi açık kalır ve tarayıcıda `http://localhost:3000` açılır.

PowerShell ile manuel başlatmak isterseniz:

```powershell
$env:ENABLE_LOCAL_BUILD="1"; npm run dev
```

## Prod denemesi ve erişim ipuçları

- **Varsayılan davranış:** Prod build çalışırken orchestrator API kapalıdır ve `Orchestrator API erişimi reddedildi.` hatası 403 ile döner.
- **Bilinçli olarak açmak için:**
  - Windows CMD: `set ENABLE_LOCAL_BUILD=1 && npm run build && npm run start`
  - PowerShell: `$env:ENABLE_LOCAL_BUILD="1"; npm run build; npm run start`
- UI ve API aynı kontrolü paylaşır; bloklandığında arayüz "ENABLE_LOCAL_BUILD=1 ile çalıştırın veya npm run dev kullanın" ipucunu gösterir.
- Geliştirme modunda (`npm run dev`) bu ayar otomatik olarak etkin kabul edilir.

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
