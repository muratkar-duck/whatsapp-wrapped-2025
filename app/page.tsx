import Link from 'next/link';

export default function Home() {
  return (
    <section className="page">
      <div className="flex flex-col gap-6">
        <h1 className="text-4xl font-bold text-primary">WhatsApp Wrapped 2025</h1>
        <p className="text-lg text-gray-700">
          Bu proje, WhatsApp sohbet dökümlerinden deterministik, baskıya hazır çok sayfalı raporlar
          üretmek için hazırlanmış bir Next.js + TypeScript başlangıç iskeletidir.
        </p>
        <ol className="list-decimal space-y-3 pl-5 text-gray-800">
          <li>data/input klasörüne whatsapp.txt ve gsm.xlsx dosyalarını yerleştirin.</li>
          <li>config.json dosyasını doldurun.</li>
          <li>npm run all komutu ile raporu ve PDF çıktısını üretin.</li>
        </ol>
        <Link
          href="/report/2025"
          className="inline-flex w-fit items-center gap-2 rounded bg-accent px-4 py-2 text-white shadow"
        >
          Örnek raporu görüntüle
        </Link>
      </div>
    </section>
  );
}
