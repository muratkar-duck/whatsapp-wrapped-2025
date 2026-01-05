'use client';

import { useEffect, useState } from 'react';

type LocalBuildState = {
  allowed: boolean | null;
  hint: string | null;
};

export function useLocalBuildStatus(): LocalBuildState {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/local-build');
        const payload = await res.json().catch(() => ({}));
        if (!cancelled) {
          setAllowed(Boolean(payload?.allowed));
          setHint(payload?.hint ?? null);
        }
      } catch {
        if (!cancelled) {
          setAllowed(null);
          setHint('ENABLE_LOCAL_BUILD=1 ile çalıştırın veya npm run dev kullanın.');
        }
      }
    };

    fetchStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  return { allowed, hint };
}
