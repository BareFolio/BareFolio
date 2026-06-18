'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { SHARED_FIELD_STYLE, floatingLabelStyle } from './FloatingField';

/* ─── Date-of-birth field ─────────────────────────────────────────
   A floating-label field enforcing DD/MM/YYYY. The user can either type the
   date (digits are masked — slashes inserted, non-digits ignored, capped at
   8 digits) or pick it from a custom calendar that drops down directly under
   the field (same width, toggled by the trailing icon). Both paths funnel
   through the same `value` string in DD/MM/YYYY form. */

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Keep only digits, cap at 8, and insert the DD/MM/YYYY slashes. */
function maskDate(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  let out = d.slice(0, 2);
  if (d.length >= 3) out += '/' + d.slice(2, 4);
  if (d.length >= 5) out += '/' + d.slice(4, 8);
  return out;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Parse a complete DD/MM/YYYY string into a Date, or null. */
function parseDisplay(display: string): Date | null {
  const m = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  // Reject overflow (e.g. 31/02) — Date silently rolls over.
  if (d.getDate() !== Number(dd) || d.getMonth() !== Number(mm) - 1) return null;
  return d;
}

export default function DateField({
  label,
  value,
  onValue,
  wrapperStyle,
}: {
  label: string;
  value: string;
  onValue: (v: string) => void;
  wrapperStyle?: React.CSSProperties;
}) {
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const floated = focused || value.length > 0;

  // Close the calendar when clicking anywhere outside the field.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!rootRef.current) return;
      // Ignore clicks on nodes that an in-calendar handler just detached
      // (e.g. a year button removed when the view switches) — otherwise a
      // detached node reads as "outside" and wrongly closes the panel.
      if (!target.isConnected) return;
      if (!rootRef.current.contains(target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: 'relative', ...wrapperStyle }}>
      <label style={floatingLabelStyle({ floated, focused })}>{label}</label>

      <input
        type="text"
        inputMode="numeric"
        value={value}
        placeholder={floated ? 'DD/MM/YYYY' : ''}
        onChange={e => onValue(maskDate(e.target.value))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label={label}
        style={{
          ...SHARED_FIELD_STYLE,
          borderColor: focused || open ? '#101010' : '#e5e5e5',
          padding: '10px 40px 10px 12px',
        }}
      />

      <button
        type="button"
        aria-label="Toggle calendar"
        aria-expanded={open}
        // onMouseDown so the toggle wins the race against the input's blur and
        // the outside-click handler, keeping the open/close state predictable.
        onMouseDown={e => {
          e.preventDefault();
          setOpen(o => !o);
        }}
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          border: 'none',
          background: 'transparent',
          color: open ? '#101010' : '#737373',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <Calendar size={17} />
      </button>

      {open && (
        <CalendarPanel
          selected={parseDisplay(value)}
          onSelect={d => {
            onValue(`${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ─── Calendar drop-down ──────────────────────────────────────────
   Full-width panel anchored just below the field. The header exposes the
   month and the year as separate buttons: tap the year to pick from a
   scrollable year list, tap the month to pick from a month grid. Either pick
   returns to the day grid (it never closes the panel) — only choosing a day
   commits the value and closes. */
function CalendarPanel({
  selected,
  onSelect,
}: {
  selected: Date | null;
  onSelect: (d: Date) => void;
}) {
  const today = new Date();
  const anchor = selected ?? today;
  const [view, setView] = useState<'days' | 'months' | 'years'>('days');
  const [month, setMonth] = useState(anchor.getMonth());
  const [year, setYear] = useState(anchor.getFullYear());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const stepMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m);
    setYear(y);
  };

  const isSelected = (day: number) =>
    !!selected &&
    selected.getDate() === day &&
    selected.getMonth() === month &&
    selected.getFullYear() === year;

  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === month &&
    today.getFullYear() === year;

  const years: number[] = [];
  for (let y = today.getFullYear(); y >= 1900; y--) years.push(y);

  const headerLabel: React.CSSProperties = {
    border: 'none', background: 'transparent', fontFamily: 'inherit',
    fontSize: '14px', fontWeight: 600, color: '#101010', cursor: 'pointer',
    padding: '4px 8px', borderRadius: '8px',
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        left: 0,
        right: 0,
        background: '#fff',
        border: '1.5px solid #e5e5e5',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        padding: '12px',
        zIndex: 60,
      }}
    >
      {/* Header: ‹  Month  Year  › */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <button type="button" aria-label="Previous month" onMouseDown={e => { e.preventDefault(); stepMonth(-1); }} style={navBtn}>
          <ChevronLeft size={16} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setView(v => (v === 'months' ? 'days' : 'months')); }}
            style={{ ...headerLabel, background: view === 'months' ? '#f5f5f5' : 'transparent' }}
          >
            {MONTHS[month]}
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setView(v => (v === 'years' ? 'days' : 'years')); }}
            style={{ ...headerLabel, background: view === 'years' ? '#f5f5f5' : 'transparent' }}
          >
            {year}
          </button>
        </div>
        <button type="button" aria-label="Next month" onMouseDown={e => { e.preventDefault(); stepMonth(1); }} style={navBtn}>
          <ChevronRight size={16} />
        </button>
      </div>

      {view === 'days' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
            {WEEKDAYS.map(w => (
              <div key={w} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#a3a3a3', padding: '4px 0' }}>
                {w}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {cells.map((day, i) =>
              day === null ? (
                <div key={`b${i}`} />
              ) : (
                <button
                  key={day}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); onSelect(new Date(year, month, day)); }}
                  style={{
                    aspectRatio: '1 / 1',
                    border: isToday(day) && !isSelected(day) ? '1px solid #e5e5e5' : 'none',
                    borderRadius: '8px',
                    background: isSelected(day) ? '#101010' : 'transparent',
                    color: isSelected(day) ? '#fff' : '#101010',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { if (!isSelected(day)) (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5'; }}
                  onMouseLeave={e => { if (!isSelected(day)) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  {day}
                </button>
              )
            )}
          </div>
        </>
      )}

      {view === 'months' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
          {MONTHS_SHORT.map((m, idx) => (
            <button
              key={m}
              type="button"
              onMouseDown={e => { e.preventDefault(); setMonth(idx); setView('days'); }}
              style={{
                padding: '10px 0',
                border: 'none',
                borderRadius: '8px',
                background: idx === month ? '#101010' : 'transparent',
                color: idx === month ? '#fff' : '#101010',
                fontFamily: 'inherit',
                fontSize: '13px',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (idx !== month) (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5'; }}
              onMouseLeave={e => { if (idx !== month) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {view === 'years' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', maxHeight: '180px', overflowY: 'auto' }}>
          {years.map(y => (
            <button
              key={y}
              type="button"
              onMouseDown={e => { e.preventDefault(); setYear(y); setView('days'); }}
              style={{
                padding: '8px 0',
                border: 'none',
                borderRadius: '8px',
                background: y === year ? '#101010' : 'transparent',
                color: y === year ? '#fff' : '#101010',
                fontFamily: 'inherit',
                fontSize: '13px',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (y !== year) (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5'; }}
              onMouseLeave={e => { if (y !== year) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              {y}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const navBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '28px',
  height: '28px',
  border: 'none',
  background: 'transparent',
  color: '#737373',
  cursor: 'pointer',
  padding: 0,
  borderRadius: '8px',
};
