# Parsing & metrik özeti

## Giriş formatı
- Satır formu: `[dd.mm.yyyy HH:MM:SS] İsim: mesaj`
- Çok satırlı: Tarih/saat ile başlamayan satırlar önceki mesaja eklenir (`\n`).
- Katılımcılar: **Murat Kar** ve **Rümeysa Akbulut** (tam eşleşme).

## Tür sınıflandırması
- Foto: `<...-PHOTO-...>`
- Video: `<...-VIDEO-...>`
- Ses: `<...-AUDIO-...>`
- Sticker: `<...-STICKER-...>`
- Sesli arama: `"Sesli arama." + süre → call_voice_answered`, `"Cevaplanmadı" → call_voice_missed`
- Görüntülü arama: `"Görüntülü arama." + süre → call_video_answered`, `"Cevaplanmadı" → call_video_missed`
- Silinen: `"Bu mesaj silindi"` → dışla
- Sistem/şifreleme/ekleme bildirimleri: `system` → dışla

Dahil edilenler: text + tüm medya + çağrılar. Sistem ve silinen mesajlar tüm hesaplamalardan hariçtir.

## Zamanlama kuralları
- Türkiye yerel zamanı kullanılır (Date constructor, UTC'ye çevirmeden).
- Gün anahtarı: `YYYY-MM-DD` (`getFullYear/getMonth/getDate`).
- Ay anahtarı: `YYYY-MM`.
- Hafta anahtarı: Pazartesi başlangıçlı ISO-benzeri; etiket `YYYY-Wxx`.
- Boş günler günlük seride 0 ile doldurulur; sakin gün listesi bu 0'ları da içerir.

## Hesaplanan metrikler
- Toplam mesaj, kişi başı sayılar ve yüzdeler.
- Günlük, aylık, saatlik (0–23), haftanın günleri dağılımı.
- Ortalama mesaj uzunluğu (karakter/kelime) — yalnızca text; URL'ler temizlenir.
- En uzun 5 mesaj (kişiye göre) — URL'ler temizlenip karakter/kelime sayılır, metin tam gösterilir.
- Yanıt süreleri (run tabanlı):
  - Aynı kişiden art arda gelen mesajlar tek “run”.
  - Süre yalnızca konuşmacı değiştiğinde, önceki run'ın ilk mesajı ile sonraki run'ın ilk mesajı arasında ölçülür.
  - Ana seri 12 saat tavanlı ortalama/medyan + histogram; ayrıca tavan uygulanmamış ilk 10 uzun bekleyiş listesi.
- En yoğun/sakin 10 gün (tarih tie-break eskiyi öne alır).
- Streak: Bir gün streak'e girer, **her iki kişi de o gün en az 1 mesaj** gönderirse. En uzun streak + kırılma tarihleri.

## Medya & çağrı
- Foto/Video/Ses/Sticker toplamları (kinds).
- Sesli ve görüntülü yanıtlanan aramalar: adet + toplam süre (sn/dk/saat biçimleri çözümlenir).
- Kaçırılan aramalar: Sesli/Görüntülü adet + kimin başlattığı kırılımı.

## Sticker grupları (opsiyonel medya klasörü)
1. `webkitdirectory` ile medya dosyaları okunur.
2. Sticker dosyaları (`*-STICKER-*.webp`) için boyut kaydedilir; isim eşleşirse kullanım boyutla gruplanır.
3. Aynı boyutta birden fazla dosya varsa SHA-256 ilk 4 byte ön eki eklenerek alt grup açılır.
4. Grup anahtarı: `"<boyut> bayt"` veya `"<boyut> bayt • <hash>"`.
5. Etiket girişi (localStorage) yazdırmada gizlidir; baskıda etiket varsa gösterilir.

## İçerik analizleri
- Kelime bulutu: Türkçe stopword temizliği + diyakritik normalizasyon; sayım text mesajları ve URL'siz içerik üzerinden yapılır.
- Emoji top 10: Unicode emoji karakter sayımı (tekrar dahil).
- Temalar: 10–12 sabit kategori anahtar kelimesi; her kategori için toplam + Murat/Rümeysa örnek mesajı.
- N-gram (2-3) frekansı: text + stopword temizliği.

### Kelime bulutu görselleştirme
- Kapsam: stopword sonrası liste; diyakritik-normalize edilmiş kelimeler aynı sayılır (çeşme/cesme vb.).
- Sıralama: frekansa göre azalan; en fazla 240 kelimelik ham liste, ekranda varsayılan 140, baskıda 120 kelime kullanılır.
- Eşik: en düşük frekans, max frekansın %1.5’i ile min 2 arasında belirlenir; küçük gürültü kelimeleri elenir.
- Ölçekleme: `fontSize = minFont + ease(log(freq))*(maxFont-minFont)`; minFont=16px, maxFont≈86px (A4’e göre üst kelime 70–90px).
- Renk: sabit 16 renk paleti; `hash(kelime) % palette.length` ile deterministik atanır.
- Döndürme: yalnızca 0° veya 90°; `hash(kelime) % 10 < 3` → dikey (yaklaşık %30). Ayar debug panelinden kapatılabilir.
- Yerleşim: koyu (#0b0b0f) arkaplanlı, 3:2 oranlı yüksek dpi canvas; Archimedean spiral + piksel maskesiyle çakışmasız paketleme.
- Determinizm: mulberry32 tohumlanmış PRNG (tarih aralığı + ilk kelime + kelime listesi karması). Math.random() kullanılmaz.
- Baskı: yazdırma öncesi canvas yeniden çizilir (max 120 kelime) ve görsele dondurulur; arka planın yazdırılması için kullanıcıya hatırlatma.

## Eğlenceli bölümler
- Kahkaha algısı: 😂🤣 veya `haha/ahah/kdkd/sjsj/xdd/:p` veya yüksek ünsüz oranlı 5–30 uzunluklu dizeler. Kahkaha mesajı, önceki diğer kişinin mesajına puan yazar; top 20 listesi oluşturulur.
- Romantik anlar: Romantik kelimeler veya kalp emojisi içeren top 10 text mesajı.

## Date’i modülü
- Şekiller: `datei`, `date'i`, `date’i`, `date i` (tüm diakritik varyasyonları normalize edilir).
- Kategori: date kelimesinden önceki son anlamlı (stopword olmayan) kelime, diakritiksiz anahtar olarak tutulur.
- Çıktılar: toplam mention, kategori dağılımı, haftalık yoğunluk, son 10 örnek satır.

## Büyük final overlay
- Haftalık normalleştirilmiş (0–100) dört seri: mesaj trafiği, kahkaha skoru, romantizm, date’i yoğunluğu (yoksa 0).
- Tek canvas üzerinde renkli çizgi grafiği.

## Print layout kuralları
- Her sayfa `.page` sınıfı ile A4 dikey (210mm genişlik, min 297mm yükseklik) ve 18–22mm iç boşluk kullanır.
- `.page { page-break-after: always; break-after: page; }` ile her bölüm tek sayfadır; `.avoid-break` kartları sayfa içinde bölünmez.
- Yazdırmada kontroller ve etkileşimli elemanlar `display:none` olur (`.no-print`). Arka plan grafiklerinin yazdırılması için kullanıcıya yönerge verilir.
- Tablolar baskıda en fazla 7 satır gösterir; fazlası `print-trim` sınıfı ile gizlenir ve yalnızca ekranda açılır.
- Metin kartları baskıda kısaltılır (220–240 karakter), tema örnekleri 160 karaktere kesilir.
- Grafikler yazdırma öncesi canvastan görsele dönüştürülür ve yazdırma 500ms gecikmeli tetiklenir.

