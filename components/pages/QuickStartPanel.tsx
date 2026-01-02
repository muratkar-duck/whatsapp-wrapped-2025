'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BuildReportButton } from '../ui/BuildReportButton';
import { OpenFolderButton } from '../ui/OpenFolderButton';

type Logs = { stdout?: string; stderr?: string };

const isLocalBuildAllowed =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_ENABLE_LOCAL_BUILD === '1' ||
  process.env.ENABLE_LOCAL_BUILD === '1';

export function QuickStartPanel() {
  const [reportStatus, setReportStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [reportLogs, setReportLogs] = useState<Logs>({});
  const [pdfLogs, setPdfLogs] = useState<Logs>({});

  const reportButtonDisabled = !isLocalBuildAllowed;

  const statusLabel = useMemo(() => {
    if (reportStatus === 'running') return 'Rapor derleniyor…';
    if (reportStatus === 'success') return 'Rapor hazır ✅';
    if (reportStatus === 'error') return 'Hata aldı, logları kontrol et.';
    return 'Hazır.';
  }, [reportStatus]);

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">3 Adımda Wrapped 2025</p>
          <h2 className="text-2xl font-semibold text-primary">Hızlı Başlangıç</h2>
        </div>
        <OpenFolderButton path="data/input" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-800">Adım 1 — Dosyaları yerleştir</p>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li className="font-semibold text-gray-900">Mod A (Klasik)</li>
            <li className="pl-3 text-gray-700">data/input/whatsapp.txt</li>
            <li className="pl-3 text-gray-700">data/input/media/</li>
            <li className="pl-3 text-gray-700">data/input/gsm.xlsx (opsiyonel)</li>
            <li className="font-semibold text-gray-900">Mod B (WhatsApp export klasörü)</li>
            <li className="pl-3 text-gray-700">data/input/whatsapp/_chat.txt</li>
            <li className="pl-3 text-gray-700">Aynı klasörde tüm medya dosyaları</li>
          </ul>
          <div className="mt-4">
            <OpenFolderButton path="data/input" label="Input klasörünü aç" />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-800">Adım 2 — Raporu üret</p>
          <p className="mt-1 text-sm text-gray-600">Tek tıkla raporu çalıştır, logları buradan takip et.</p>
          <div className="mt-3 space-y-3">
            <BuildReportButton
              refreshOnSuccess
              showLogs
              onStatusChange={(status, payload) => {
                setReportStatus(status);
                setReportLogs(payload ?? {});
              }}
            />
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-800">
              <p className="font-semibold">Durum</p>
              <p className="text-gray-700">{statusLabel}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/report/2025"
                className={`inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold shadow transition ${
                  reportStatus === 'success'
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'pointer-events-none bg-gray-200 text-gray-500'
                }`}
              >
                Raporu Görüntüle
              </Link>
              {reportButtonDisabled ? (
                <span className="rounded-full bg-gray-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700">
                  Sadece yerelde kullanılabilir
                </span>
              ) : null}
            </div>
            {(reportLogs.stdout || reportLogs.stderr) && (
              <div className="rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
                {reportLogs.stdout ? (
                  <div>
                    <p className="mb-1 font-semibold text-green-300">stdout</p>
                    <pre className="whitespace-pre-wrap break-words text-green-100">{reportLogs.stdout}</pre>
                  </div>
                ) : null}
                {reportLogs.stderr ? (
                  <div className="mt-2">
                    <p className="mb-1 font-semibold text-amber-300">stderr</p>
                    <pre className="whitespace-pre-wrap break-words text-amber-100">{reportLogs.stderr}</pre>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-800">Adım 3 — PDF’i kaydet</p>
          <p className="mt-1 text-sm text-gray-600">PDF şu klasöre kaydedilir: dist/wrapped_2025.pdf</p>
          <div className="mt-3 space-y-3">
            <BuildReportButton
              action="pdf"
              label="PDF Üret"
              showLogs
              onStatusChange={(status, payload) => {
                setPdfStatus(status);
                setPdfLogs(payload ?? {});
              }}
            />
            <OpenFolderButton path="dist" label="Çıktı klasörünü aç" />
            {(pdfLogs.stdout || pdfLogs.stderr) && (
              <div className="rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
                {pdfLogs.stdout ? (
                  <div>
                    <p className="mb-1 font-semibold text-green-300">stdout</p>
                    <pre className="whitespace-pre-wrap break-words text-green-100">{pdfLogs.stdout}</pre>
                  </div>
                ) : null}
                {pdfLogs.stderr ? (
                  <div className="mt-2">
                    <p className="mb-1 font-semibold text-amber-300">stderr</p>
                    <pre className="whitespace-pre-wrap break-words text-amber-100">{pdfLogs.stderr}</pre>
                  </div>
                ) : null}
              </div>
            )}
            {pdfStatus === 'success' ? (
              <p className="text-xs font-semibold text-green-700">PDF hazır ✅ dist/wrapped_2025.pdf</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
