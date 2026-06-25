// src/lib/useHandleAvailability.ts
'use client';

import { useEffect, useState } from 'react';
import { slugifyHandle } from './onboardingMappings';
import { validateUsernameFormat, isReservedHandle } from './username';

export type HandleStatus =
  | 'idle'      // empty input — show nothing
  | 'checking'  // request in flight
  | 'available' // free
  | 'taken'     // already used
  | 'reserved'  // blocked name
  | 'invalid'   // bad format
  | 'error';    // network/server problem — keep advance disabled

// Debounced availability for one handle value. `enabled` lets the caller switch
// the hook off when the relevant identity screen isn't the active one, so no
// requests fire from later steps. Format + reserved checks run locally first to
// avoid needless round-trips.
export function useHandleAvailability(rawValue: string, enabled: boolean): HandleStatus {
  const [status, setStatus] = useState<HandleStatus>('idle');

  useEffect(() => {
    if (!enabled) {
      const reset = () => setStatus('idle');
      reset();
      return;
    }

    const handle = slugifyHandle(rawValue);

    if (handle === '') {
      const reset = () => setStatus('idle');
      reset();
      return;
    }

    const fmt = validateUsernameFormat(handle);
    if (!fmt.ok) {
      const markInvalid = () => setStatus('invalid');
      markInvalid();
      return;
    }

    if (isReservedHandle(handle)) {
      const markReserved = () => setStatus('reserved');
      markReserved();
      return;
    }

    const markChecking = () => setStatus('checking');
    markChecking();

    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch('/api/username/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: handle }),
            signal: ctrl.signal,
          });
          const data = await res.json().catch(() => ({}));
          if (data.available === true) setStatus('available');
          else if (data.reason === 'reserved') setStatus('reserved');
          else if (data.reason === 'invalid') setStatus('invalid');
          else if (data.reason === 'taken') setStatus('taken');
          else setStatus('error');
        } catch (err) {
          if ((err as Error).name === 'AbortError') return;
          setStatus('error');
        }
      })();
    }, 400);

    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [rawValue, enabled]);

  return status;
}
