'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ENDPOINTS = {
  report: '/api/build-report',
  pdf: '/api/export-pdf'
} as const;

type ActionType = keyof typeof ENDPOINTS;

type Status = 'idle' | 'running' | 'success' | 'error';

export function BuildReportButton({
  action = 'report',
  label,
  refreshOnSuccess = false,
  className
}: {
  action?: ActionType;
  label?: string;
  refreshOnSuccess?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const endpoint = ENDPOINTS[action];
  const buttonLabel = label ?? (action === 'pdf' ? 'PDF Üret' : 'Raporu Üret');

  const runBuild = async () => {
    setStatus('running');
    setMessage(action === 'pdf' ? 'PDF hazırlanıyor…' : 'Rapor derleniyor…');

    try {
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setMessage(data?.error ?? 'İşlem başarısız oldu.');
        return;
      }
      setStatus('success');
      setMessage(action === 'pdf' ? 'PDF hazırlandı.' : 'Rapor hazır.');
      if (refreshOnSuccess) {
        router.refresh();
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error?.message ?? 'İşlem başlatılamadı.');
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={runBuild}
        disabled={status === 'running'}
        className="inline-flex items-center gap-2 rounded bg-accent px-4 py-2 text-white shadow disabled:opacity-60"
      >
        {status === 'running' ? 'Çalışıyor…' : buttonLabel}
      </button>
      {message ? (
        <p
          className={`mt-2 text-sm ${
            status === 'error' ? 'text-red-600' : status === 'success' ? 'text-green-700' : 'text-gray-700'
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
