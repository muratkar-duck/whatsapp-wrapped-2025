import Link from 'next/link';
import { QuickStartPanel } from '../components/pages/QuickStartPanel';

export default function Home() {
  const faqs = [
    {
      q: 'WhatsApp export\'u nereye koyacağım?',
      a: 'data/input/whatsapp/ içine _chat.txt ve medya dosyalarını ekleyin ya da klasik modda whatsapp.txt + media klasörünü kullanın.'
    },
    {
      q: 'Raporu nasıl üretirim?',
      a: 'Hızlı Başlangıç panelindeki “Raporu Üret” butonuna basın, logları hemen altında görün.'
    },
    {
      q: 'PDF nereye kaydoluyor?',
      a: 'PDF çıktısı dist/wrapped_2025.pdf dosyasına yazılır; Çıktılar sayfasından da kontrol edebilirsiniz.'
    },
    {
      q: '0 mesaj görüyorsam ne demek?',
      a: 'Çıktıdaki toplam mesaj 0 ise genelde _chat.txt/whatsapp.txt okunamamıştır; encodingin UTF-8 olduğundan emin olun.'
    },
    {
      q: 'GSM excel opsiyonel mi?',
      a: 'Evet, data/input/gsm.xlsx dosyası sadece arama istatistikleri için kullanılır; yoksa rapor yine üretilir.'
    },
    {
      q: 'Medya koymazsam ne olur?',
      a: 'Medya dosyaları opsiyoneldir; görsel bazlı grafikler boş dönebilir ama rapor üretilir.'
    }
  ];

  return (
    <section className="page">
      <div className="flex flex-col gap-8">
        <h1 className="text-4xl font-bold text-primary">WhatsApp Wrapped 2025</h1>
        <p className="text-lg text-gray-700">
          Bu proje, WhatsApp sohbet dökümlerinden deterministik, baskıya hazır çok sayfalı raporlar
          üretmek için hazırlanmış bir Next.js + TypeScript başlangıç iskeletidir.
        </p>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-primary">Nasıl çalışır?</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-800">
            <li>WhatsApp klasörünü <code className="rounded bg-gray-100 px-2 py-[2px]">data/input/whatsapp</code> içine koy.</li>
            <li>Tek tık panelinden raporu oluştur; logları canlı takip et.</li>
            <li>PDF çıktısını <code className="rounded bg-gray-100 px-2 py-[2px]">dist/wrapped_2025.pdf</code> olarak kaydet.</li>
          </ol>
        </div>
        <QuickStartPanel />

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-primary">SSS / Mini kullanım kılavuzu</h2>
          <div className="mt-4 space-y-3">
            {faqs.map((item) => (
              <details key={item.q} className="group rounded-lg border border-gray-200 p-4">
                <summary className="cursor-pointer list-none text-base font-semibold text-gray-900">
                  {item.q}
                </summary>
                <p className="mt-2 text-sm text-gray-700 group-open:animate-fadeIn">{item.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-700">
            <p>
              Daha fazla detay için{' '}
              <Link href="/outputs" className="font-semibold text-accent underline">
                çıktı durumuna
              </Link>{' '}
              göz atabilir veya raporu{' '}
              <Link href="/report/2025" className="font-semibold text-accent underline">
                burada
              </Link>{' '}
              açabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
