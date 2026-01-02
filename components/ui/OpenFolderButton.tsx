'use client';

import { useState } from 'react';

const isLocalBuildAllowed =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_ENABLE_LOCAL_BUILD === '1' ||
  process.env.ENABLE_LOCAL_BUILD === '1';

export function OpenFolderButton({
  path,
  label = 'Klasörü Aç',
  className
}: {
  path: string;
  label?: string;
  className?: string;
}) {
  const [status, setStatus] = useState<'idle' | 'running' | 'error' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (!isLocalBuildAllowed) return;
    setStatus('running');
    setError(null);
    try {
      const res = await fetch('/api/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setError(data?.error ?? 'Klasör açılamadı.');
        return;
      }
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setError(err?.message ?? 'Klasör açılamadı.');
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        disabled={!isLocalBuildAllowed || status === 'running'}
        onClick={handleClick}
        className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:border-accent hover:text-accent disabled:opacity-60"
      >
        {status === 'running' ? 'Açılıyor…' : label}
      </button>
      {!isLocalBuildAllowed ? (
        <span className="ml-2 inline-flex items-center gap-2 rounded-full bg-gray-200 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700">
          Sadece yerelde kullanılabilir
        </span>
      ) : null}
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      {status === 'success' ? <p className="mt-1 text-xs text-green-600">Klasör açıldı.</p> : null}
    </div>
  );
}
