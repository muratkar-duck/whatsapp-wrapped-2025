# WhatsApp Wrapped 2025

Tek dosyalık, çevrimdışı çalışan bir HTML uygulaması. iPhone WhatsApp sohbet çıktısını (.txt) alır ve yazdırılabilir A4 “2025 Wrapped” raporu üretir.

## Kullanım
1. `index.html` dosyasını çift tıklayarak tarayıcıda açın (Chrome/Edge önerilir).
2. Üstteki panelden sohbet `.txt` dosyasını seçin.
3. Sticker/medya zenginleştirmesi için isterseniz aynı sohbetin medya klasörünü (webkitdirectory) seçin.
4. **Analiz Et** butonuna basın; sayfalar dolunca `Ctrl/Cmd + P` ile PDF olarak kaydedin.

## PDF olarak dışa aktarım
- `Analiz Et` sonrası üstteki **PDF’e Hazırla** butonuna tıklayın. Tüm canvas grafikler görüntü olarak dondurulur.
- Tarayıcı yazdırma penceresinde A4 dikey seçin ve **Background graphics / Arka plan grafikleri** ayarını açık tutun.
- Kenar boşluğunu mümkünse “None” veya “Minimum” yapın; her `.page` otomatik olarak sayfa kırar.
- Chrome/Firefox’ta çevrimdışı çalışır; ek eklenti gerekmez.

## Özellikler
- Çift taraflı (Murat Kar, Rümeysa Akbulut) mesaj sınıflandırması ve toplamlar
- Günlük/aylık/saatlik/haftalık grafikler (yerel Türkiye saati, boş günler doldurulur)
- Yanıt süresi analizi (12 saat tavanlı ve uç değer listesi)
- Çağrı süreleri ve kaçırılan arama kırılımı
- Medya ve sticker grupları (dosya boyutuna göre gruplanır, etiketlenebilir)
- Kelime bulutu, emoji/tema/N-gram istatistikleri
- Kahkaha, romantik mesaj ve “date’i” yoğunluğu
- Haftalık final overlay grafiği
- Yazıcı dostu A4 sayfa düzeni, debug paneli (yazdırmada gizli)

## Performans ve gizlilik
- Tüm hesaplamalar tarayıcıda, tek geçişte yapılır; dış servislere istek yoktur.
- Büyük sohbetler için (78k mesaj) minimal DOM güncellemeleri ve basit canvas çizimleri kullanılır.
- Yerel veri: etiketler `localStorage` içinde tutulur, başka yere gönderilmez.

