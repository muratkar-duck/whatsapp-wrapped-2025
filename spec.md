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

