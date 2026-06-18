'use client';

import React, { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SHARED_FIELD_STYLE, floatingLabelStyle } from './FloatingField';
import { COUNTRIES } from '@/lib/countries';

/* ─── Country combobox ────────────────────────────────────────────
   A floating-label field that opens a scrollable list of every country
   (English names). Typing filters the list live — matches that start with
   the query are surfaced first. Selecting an option closes the list and
   stores the country name in `value`. */

export default function CountrySelect({
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
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const floated = focused || open || value.length > 0;

  const q = query.trim().toLowerCase();
  const filtered =
    q === ''
      ? COUNTRIES
      : COUNTRIES.filter(c => c.toLowerCase().includes(q)).sort((a, b) => {
          const sa = a.toLowerCase().startsWith(q) ? 0 : 1;
          const sb = b.toLowerCase().startsWith(q) ? 0 : 1;
          return sa - sb || a.localeCompare(b);
        });

  const select = (country: string) => {
    onValue(country);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div style={{ position: 'relative', ...wrapperStyle }}>
      <label style={floatingLabelStyle({ floated, focused })}>{label}</label>

      <input
        ref={inputRef}
        type="text"
        value={open ? query : value}
        placeholder=""
        aria-label={label}
        autoComplete="off"
        onChange={e => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => {
          setFocused(true);
          setOpen(true);
          setQuery('');
        }}
        onBlur={() => {
          setFocused(false);
          // Delay so a click on an option registers before the list unmounts.
          setTimeout(() => {
            setOpen(false);
            setQuery('');
          }, 120);
        }}
        style={{
          ...SHARED_FIELD_STYLE,
          borderColor: focused || open ? '#101010' : '#e5e5e5',
          padding: '10px 40px 10px 12px',
          cursor: 'pointer',
        }}
      />

      <ChevronDown
        size={17}
        style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
          color: '#737373',
          pointerEvents: 'none',
          transition: 'transform .15s ease',
        }}
      />

      {open && (
        <ul
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            margin: 0,
            padding: '4px',
            listStyle: 'none',
            maxHeight: '200px',
            overflowY: 'auto',
            background: '#fff',
            border: '1.5px solid #e5e5e5',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            zIndex: 50,
          }}
        >
          {filtered.length === 0 ? (
            <li style={{ padding: '8px 10px', fontSize: '14px', color: '#a3a3a3' }}>
              No matches
            </li>
          ) : (
            filtered.map(country => {
              const isSelected = country === value;
              return (
                <li key={country}>
                  <button
                    type="button"
                    // onMouseDown fires before the input's onBlur, so selection
                    // is captured even though blur is about to run.
                    onMouseDown={e => {
                      e.preventDefault();
                      select(country);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      border: 'none',
                      borderRadius: '8px',
                      background: isSelected ? '#f5f5f5' : 'transparent',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      color: '#101010',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = isSelected
                        ? '#f5f5f5'
                        : 'transparent';
                    }}
                  >
                    {country}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
