'use client';

import { useState, useEffect, useRef } from 'react';

/* ─── 5-digit verification code input ────────────────────────────
   The whole row behaves like a single entry point: the caret stays on the
   first empty box, digits fill the boxes left-to-right as you type, and the
   "0" placeholders vanish as soon as the field is focused. Clicking anywhere
   in the row drops you onto the active (first empty) box. */
export default function CodeInput({ value, onChange, length = 5 }: {
  value: string; onChange: (v: string) => void; length?: number;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [focused, setFocused] = useState(false);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');
  const activeIndex = Math.min(value.length, length - 1);

  // Keep the caret on the active box while the user is entering the code.
  useEffect(() => {
    if (focused) refs.current[activeIndex]?.focus();
  }, [focused, activeIndex]);

  const focusActive = () => refs.current[Math.min(value.length, length - 1)]?.focus();

  return (
    <div
      onClick={focusActive}
      style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}
    >
      {digits.map((d, i) => {
        const isActive = i === activeIndex;
        return (
          <input
            key={i}
            ref={el => { refs.current[i] = el; }}
            value={d}
            inputMode="numeric"
            maxLength={1}
            readOnly={!isActive}
            tabIndex={isActive ? 0 : -1}
            placeholder={focused || value.length > 0 ? '' : '0'}
            aria-label={`Digit ${i + 1}`}
            onChange={e => {
              const typed = e.target.value.replace(/\D/g, '');
              if (!typed) return;
              const next = (value + typed).slice(0, length);
              onChange(next);
              refs.current[Math.min(next.length, length - 1)]?.focus();
            }}
            onKeyDown={e => {
              if (e.key === 'Backspace') {
                e.preventDefault();
                const next = value.slice(0, -1);
                onChange(next);
                refs.current[Math.min(next.length, length - 1)]?.focus();
              }
            }}
            onFocus={() => setFocused(true)}
            onBlur={e => { if (!refs.current.includes(e.relatedTarget as HTMLInputElement)) setFocused(false); }}
            style={{
              width: '39px', height: '45px',
              border: `1.5px solid ${focused && isActive ? '#101010' : '#e5e5e5'}`,
              borderRadius: '12px',
              textAlign: 'center', fontSize: '17px', fontWeight: 500,
              color: '#101010', background: '#fff',
              outline: 'none', fontFamily: 'inherit',
              caretColor: 'transparent', cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
          />
        );
      })}
    </div>
  );
}
