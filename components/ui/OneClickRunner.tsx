'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalBuildStatus } from '../hooks/useLocalBuildStatus';

type RunnerStatus = 'idle' | 'running' | 'success' | 'error';
type LogLevel = 'info' | 'success' | 'error';

type RunnerEvent = {
  status: 'running' | 'success' | 'error';
  step?: 'parse' | 'report' | 'pdf' | 'validate' | 'complete';
  message: string;
  hint?: string;
};

type LogEntry = {
  id: string;
  level: LogLevel;
  message: string;
  hint?: string;
};

export function OneClickRunner() {
  const [status, setStatus] = useState<RunnerStatus>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [withPdf, setWithPdf] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const { allowed: isLocalBuildAllowed, hint: localBuildHint } = useLocalBuildStatus();

  const addLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => [...prev, entry]);
  }, []);

  const scrollToBottom = useCallback(() => {
    const node = logContainerRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [logs, scrollToBottom]);

  const onRun = async () => {
    if (isLocalBuildAllowed === false) {
      setStatus('error');
      addLog({
        id: crypto.randomUUID(),
        level: 'error',
        message: 'Orchestrator API erişimi reddedildi.',
        hint: localBuildHint ?? 'ENABLE_LOCAL_BUILD=1 ile çalıştırın veya development modunda açın.'
      });
      return;
    }
    setStatus('running');
    setLogs([]);
    let hadError = false;

    try {
      const res = await fetch('/api/run-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pdf: withPdf })
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setStatus('error');
        addLog({
          id: crypto.randomUUID(),
          level: 'error',
          message: payload?.error ?? 'Orchestrator API erişimi reddedildi.',
          hint: payload?.hint ?? localBuildHint
        });
        return;
      }

      if (!res.body) {
        setStatus('error');
        addLog({ id: crypto.randomUUID(), level: 'error', message: 'Akış başlatılamadı.' });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split(/\n/);
        buffer = parts.pop() ?? '';

        parts
          .map((line) => line.trim())
          .filter(Boolean)
          .forEach((line) => {
            try {
              const event = JSON.parse(line) as RunnerEvent;
              const level: LogLevel = event.status === 'error' ? 'error' : event.status === 'success' ? 'success' : 'info';
              addLog({ id: crypto.randomUUID(), level, message: event.message, hint: event.hint });
              if (event.status === 'error') {
                setStatus('error');
                hadError = true;
              } else if (event.step === 'complete') {
                setStatus('success');
              }
            } catch (error) {
              addLog({ id: crypto.randomUUID(), level: 'info', message: line });
            }
          });
      }

      if (!hadError) {
        setStatus('success');
      }
    } catch (error: any) {
      setStatus('error');
      addLog({ id: crypto.randomUUID(), level: 'error', message: error?.message ?? 'Bilinmeyen hata' });
    }
  };

  const statusBadge = useMemo(() => {
    if (status === 'running') return 'Çalışıyor…';
    if (status === 'success') return 'Rapor hazır ✅';
    if (status === 'error') return 'Hata aldı';
    return 'Hazır';
  }, [status]);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Tek tık orchestrator</p>
          <h3 className="text-xl font-semibold text-primary">Raporu Oluştur (Tek Tık)</h3>
          <p className="text-sm text-gray-700">Sırasıyla parse → rapor → PDF üretir, logları canlı izleyin.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              checked={withPdf}
              onChange={(e) => setWithPdf(e.target.checked)}
            />
            PDF de üret
          </label>
          {isLocalBuildAllowed === false ? (
            <span className="rounded-full bg-gray-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700">
              Sadece yerelde kullanılabilir
            </span>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={onRun}
        disabled={status === 'running' || isLocalBuildAllowed === false}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-center text-lg font-semibold text-white shadow hover:bg-accent/90 disabled:opacity-60"
      >
        {status === 'running' ? 'Çalışıyor…' : 'Raporu Oluştur (Tek Tık)'}
      </button>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span
          className={`rounded-full px-3 py-1 font-semibold ${
            status === 'success'
              ? 'bg-green-100 text-green-800'
              : status === 'error'
                ? 'bg-red-100 text-red-800'
                : status === 'running'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
          }`}
        >
          {statusBadge}
        </span>
        {status === 'success' ? (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/report/2025"
              className="inline-flex items-center gap-2 rounded bg-primary px-3 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90"
            >
              Raporu Görüntüle
            </Link>
            <Link
              href="/outputs"
              className="inline-flex items-center gap-2 rounded bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-gray-800"
            >
              PDF’i Aç
            </Link>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Canlı Loglar</p>
          <p className="text-xs text-gray-600">info gri · success yeşil · error kırmızı</p>
        </div>
        <div ref={logContainerRef} className="h-56 overflow-y-auto rounded-lg bg-black/90 p-3 font-mono text-xs text-gray-100">
          {logs.length === 0 ? (
            <p className="text-gray-400">Henüz log yok. Butona basınca akmaya başlayacak.</p>
          ) : (
            <ul className="space-y-2">
              {logs.map((log) => (
                <li key={log.id} className={`whitespace-pre-wrap break-words ${log.level === 'success' ? 'text-emerald-200' : log.level === 'error' ? 'text-red-200' : 'text-gray-200'}`}>
                  <span className="font-semibold">[{log.level.toUpperCase()}]</span> {log.message}
                  {log.hint ? <span className="ml-2 text-amber-200">→ {log.hint}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
