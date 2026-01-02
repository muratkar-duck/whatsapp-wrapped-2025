import Link from 'next/link';
import { BuildReportButton } from '../components/ui/BuildReportButton';

export default function Home() {
  return (
    <section className="page">
      <div className="flex flex-col gap-6">
        <h1 className="text-4xl font-bold text-primary">WhatsApp Wrapped 2025</h1>
        <p className="text-lg text-gray-700">
          Bu proje, WhatsApp sohbet dökümlerinden deterministik, baskıya hazır çok sayfalı raporlar
          üretmek için hazırlanmış bir Next.js + TypeScript başlangıç iskeletidir.
        </p>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="mb-3 font-semibold text-gray-800">Input klasör yapısı</p>
          <ul className="space-y-1 text-gray-800">
            <li>
              <strong>Yeni (tercih edilen):</strong> data/input/whatsapp/ → _chat.txt + medya dosyaları
            </li>
            <li>
              <strong>Eski:</strong> data/input/whatsapp.txt + data/input/media/
            </li>
            <li>data/input/gsm.xlsx (opsiyonel, arama istatistikleri için)</li>
            <li>root klasörde config.json</li>
          </ul>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <BuildReportButton refreshOnSuccess />
          <BuildReportButton action="pdf" label="PDF Üret" />
          <Link
            href="/report/2025"
            className="inline-flex w-fit items-center gap-2 rounded bg-primary px-4 py-2 text-white shadow"
          >
            Raporu görüntüle
          </Link>
        </div>
      </div>
    </section>
  );
}
