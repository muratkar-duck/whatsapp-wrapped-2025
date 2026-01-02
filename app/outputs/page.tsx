import { promises as fs } from 'node:fs';
import path from 'node:path';
import { OpenFolderButton } from '../../components/ui/OpenFolderButton';

const DIST_DIR = path.join(process.cwd(), 'dist');
const REPORT_PATH = path.join(DIST_DIR, 'report.json');
const PDF_PATH = path.join(DIST_DIR, 'wrapped_2025.pdf');

async function getFileStatus(target: string) {
  try {
    const stat = await fs.stat(target);
    return { exists: true, mtime: stat.mtime };
  } catch {
    return { exists: false, mtime: null };
  }
}

export default async function OutputsPage() {
  const [report, pdf] = await Promise.all([getFileStatus(REPORT_PATH), getFileStatus(PDF_PATH)]);
  const latestDate = [report.mtime, pdf.mtime]
    .filter(Boolean)
    .sort((a, b) => (b!.getTime?.() ?? 0) - (a!.getTime?.() ?? 0))[0] as Date | undefined;

  return (
    <section className="page">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Çıktılar</p>
            <h1 className="text-3xl font-bold text-primary">dist/ durumu</h1>
            <p className="text-gray-700">Rapor ve PDF üretiminden çıkan dosyaların konumu ve durumu.</p>
          </div>
          <OpenFolderButton path="dist" label="Klasörü Aç" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-800">dist/report.json</p>
            <p className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
              report.exists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {report.exists ? '✅ Var' : '❌ Yok'}
            </p>
            {report.mtime ? (
              <p className="mt-2 text-sm text-gray-700">Güncellendi: {report.mtime.toLocaleString('tr-TR')}</p>
            ) : (
              <p className="mt-2 text-sm text-gray-700">Rapor henüz oluşturulmadı.</p>
            )}
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-800">dist/wrapped_2025.pdf</p>
            <p className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
              pdf.exists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {pdf.exists ? '✅ Var' : '❌ Yok'}
            </p>
            {pdf.mtime ? (
              <p className="mt-2 text-sm text-gray-700">Güncellendi: {pdf.mtime.toLocaleString('tr-TR')}</p>
            ) : (
              <p className="mt-2 text-sm text-gray-700">PDF henüz oluşturulmadı.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-gray-200 bg-white/60 p-5 text-sm text-gray-800">
          <p className="font-semibold text-gray-900">Son build tarihi</p>
          <p className="mt-1 text-gray-700">
            {latestDate ? latestDate.toLocaleString('tr-TR') : 'Henüz build alınmadı.'}
          </p>
          <p className="mt-3 text-gray-600">Çıktılar dist/ klasörüne yazılır. Klasörü açarak rapor dosyalarına direkt erişebilirsiniz.</p>
        </div>
      </div>
    </section>
  );
}
