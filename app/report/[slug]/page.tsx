import { promises as fs } from 'node:fs';
import path from 'node:path';
import { BuildReportButton } from '../../../components/ui/BuildReportButton';
import { OpenFolderButton } from '../../../components/ui/OpenFolderButton';
import SummaryGrid from '../../../components/pages/SummaryGrid';
import type { Report } from '../../../lib/data/types';
import { reportSchema } from '../../../lib/data/schema';

export const dynamic = 'force-dynamic';

const REPORT_PATH = path.join(process.cwd(), 'dist', 'report.json');
const CONFIG_PATH = path.join(process.cwd(), 'config.json');
const GSM_PATH = path.join(process.cwd(), 'data', 'input', 'gsm.xlsx');
const EXPORT_CHAT_PATH = path.join(process.cwd(), 'data', 'input', 'whatsapp', '_chat.txt');
const LEGACY_CHAT_PATH = path.join(process.cwd(), 'data', 'input', 'whatsapp.txt');

async function pathExists(target: string) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function loadReport(): Promise<Report | null> {
  try {
    const content = await fs.readFile(REPORT_PATH, 'utf-8');
    if (!content.trim()) return null;
    const parsed = JSON.parse(content);
    const result = reportSchema.safeParse(parsed);
    if (!result.success) {
      console.error('Report validation failed', result.error.message);
      return null;
    }
    return result.data;
  } catch (error) {
    console.error('Report file missing', error);
    return null;
  }
}

async function getInputStatus() {
  const hasExportChat = await pathExists(EXPORT_CHAT_PATH);
  const hasLegacyChat = await pathExists(LEGACY_CHAT_PATH);
  const chatPath = hasExportChat ? EXPORT_CHAT_PATH : hasLegacyChat ? LEGACY_CHAT_PATH : null;
  const mode = hasExportChat ? 'Yeni WhatsApp export' : hasLegacyChat ? 'Eski whatsapp.txt' : null;
  const mediaDir = hasExportChat
    ? path.join(process.cwd(), 'data', 'input', 'whatsapp')
    : path.join(process.cwd(), 'data', 'input', 'media');

  let mediaCount = 0;
  try {
    const entries = await fs.readdir(mediaDir);
    mediaCount = entries.filter((file) => file !== '_chat.txt').length;
  } catch {
    mediaCount = 0;
  }

  return {
    configExists: await pathExists(CONFIG_PATH),
    chatExists: Boolean(chatPath),
    chatPath,
    mode,
    gsmExists: await pathExists(GSM_PATH),
    mediaDir,
    mediaCount
  };
}

export default async function ReportPage() {
  const [report, inputStatus] = await Promise.all([loadReport(), getInputStatus()]);
  const hasReportData = Boolean(report && report.metrics.totalMessages > 0);

  const missing: { label: string; optional?: boolean }[] = [];
  if (!inputStatus.configExists) missing.push({ label: 'config.json yok' });
  if (!inputStatus.chatExists) missing.push({ label: 'WhatsApp chat dosyası yok' });
  if (!inputStatus.gsmExists) missing.push({ label: 'gsm.xlsx yok (opsiyonel)', optional: true });
  if (inputStatus.chatExists && inputStatus.mediaCount === 0)
    missing.push({ label: 'medya klasörü boş veya yok (opsiyonel)', optional: true });

  const metaCard = (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-700">İnput kontrolü</p>
      <ul className="mt-2 space-y-1 text-sm text-gray-800">
        <li>
          <strong>config.json:</strong> {inputStatus.configExists ? 'OK' : 'Eksik'}
        </li>
        <li>
          <strong>WhatsApp chat:</strong> {inputStatus.chatPath ?? 'Bulunamadı'}
        </li>
        <li>
          <strong>Mod:</strong> {inputStatus.mode ?? 'N/A'}
        </li>
        <li>
          <strong>Medya klasörü:</strong> {inputStatus.mediaDir} ({inputStatus.mediaCount} dosya)
        </li>
        <li>
          <strong>gsm.xlsx:</strong> {inputStatus.gsmExists ? 'OK' : 'Opsiyonel - yok'}
        </li>
      </ul>
    </div>
  );

  if (!hasReportData) {
    return (
      <section className="page">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-primary">Henüz rapor üretilmedi</h1>
          <p className="text-gray-700">dist/report.json yok, okunamıyor veya toplam mesaj 0 gözüküyor.</p>
          <div className="flex flex-wrap items-center gap-3">
            <BuildReportButton refreshOnSuccess />
            <OpenFolderButton path="data/input" label="Input Klasörünü Aç" />
          </div>
          {missing.length ? (
            <div className="rounded-xl border border-dashed border-red-200 bg-red-50 p-4 text-red-800">
              <p className="font-semibold">Eksik veya opsiyonel dosyalar</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {missing.map((item) => (
                  <li key={item.label} className={item.optional ? 'text-red-700/80' : 'text-red-800'}>
                    {item.label}
                  </li>
                ))}
              </ul>
              {!inputStatus.chatExists ? (
                <p className="mt-2 text-sm text-red-700">
                  Beklenen: data/input/whatsapp/_chat.txt (tercih edilen) veya data/input/whatsapp.txt
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="font-semibold text-gray-900">Troubleshooting</p>
            <ul className="mt-2 space-y-2 text-sm text-gray-800">
              <li>_chat.txt yok / whatsapp.txt yok → data/input altına yerleştirildiğinden emin olun.</li>
              <li>config.json yok → root dizinde bulunmalı.</li>
              <li>Dosya encoding farklı olabilir (UTF-8 önerilir).</li>
              <li>Build loglarını görmek için ana sayfadan üretim yap.</li>
            </ul>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <BuildReportButton label="Raporu Üret" refreshOnSuccess />
              <BuildReportButton action="pdf" label="PDF Üret" />
            </div>
          </div>
          {metaCard}
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm uppercase tracking-[0.25em] text-gray-500">Wrapped {report.year}</p>
          <BuildReportButton refreshOnSuccess />
          <BuildReportButton action="pdf" label="PDF Üret" />
        </div>
        <h1 className="text-4xl font-bold text-primary">{report.ownerName} x {report.partnerName}</h1>
        <p className="text-gray-700">Çift yönlü mesajlaşma verinizden hesaplanan özet gösterge panosu.</p>
        <SummaryGrid report={report} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {metaCard}
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-700">Rapor bilgisi</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-800">
              <li>
                <strong>Üretildi:</strong> {new Date(report.generatedAt).toLocaleString('tr-TR')}
              </li>
              <li>
                <strong>Toplam mesaj:</strong> {report.metrics.totalMessages}
              </li>
              <li>
                <strong>Aktif gün:</strong> {report.metrics.activeDays}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
