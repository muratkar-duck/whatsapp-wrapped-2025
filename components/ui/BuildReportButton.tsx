'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ENDPOINTS = {
  report: '/api/build-report',
  pdf: '/api/export-pdf'
} as const;

type ActionType = keyof typeof ENDPOINTS;

type Status = 'idle' | 'running' | 'success' | 'error';

const isLocalBuildAllowed =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_ENABLE_LOCAL_BUILD === '1' ||
  process.env.ENABLE_LOCAL_BUILD === '1';

export function BuildReportButton({
  action = 'report',
  label,
  refreshOnSuccess = false,
  className,
  showLogs = false,
  onStatusChange
}: {
  action?: ActionType;
  label?: string;
  refreshOnSuccess?: boolean;
  className?: string;
  showLogs?: boolean;
  onStatusChange?: (
    status: Status,
    payload?: {
      stdout?: string;
      stderr?: string;
    }
  ) => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');

  const endpoint = ENDPOINTS[action];
  const buttonLabel = label ?? (action === 'pdf' ? 'PDF Üret' : 'Raporu Üret');

  const runBuild = async () => {
    if (!isLocalBuildAllowed) return;
    setStatus('running');
    setMessage(action === 'pdf' ? 'PDF hazırlanıyor…' : 'Rapor derleniyor…');
    setStdout('');
    setStderr('');
    onStatusChange?.('running');

    try {
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setMessage(data?.error ?? 'İşlem başarısız oldu.');
        setStdout(data?.stdout ?? '');
        setStderr(data?.stderr ?? '');
        onStatusChange?.('error', { stdout: data?.stdout, stderr: data?.stderr });
        return;
      }
      setStatus('success');
      setMessage(action === 'pdf' ? 'PDF hazırlandı.' : 'Rapor hazır ✅');
      setStdout(data?.stdout ?? '');
      setStderr(data?.stderr ?? '');
      onStatusChange?.('success', { stdout: data?.stdout, stderr: data?.stderr });
      if (refreshOnSuccess) {
        router.refresh();
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error?.message ?? 'İşlem başlatılamadı.');
      onStatusChange?.('error');
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={runBuild}
        disabled={status === 'running' || !isLocalBuildAllowed}
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
      {!isLocalBuildAllowed ? (
        <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700">
          Sadece yerelde kullanılabilir
        </span>
      ) : null}
      {showLogs && (stdout || stderr) ? (
        <div className="mt-3 space-y-2 rounded-md bg-gray-900 p-3 text-xs text-gray-100">
          {stdout ? (
            <div>
              <p className="mb-1 font-semibold text-green-300">stdout</p>
              <pre className="whitespace-pre-wrap break-words text-green-100">{stdout}</pre>
            </div>
          ) : null}
          {stderr ? (
            <div>
              <p className="mb-1 font-semibold text-amber-300">stderr</p>
              <pre className="whitespace-pre-wrap break-words text-amber-100">{stderr}</pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
