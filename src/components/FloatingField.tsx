'use client';

import React, { useState } from 'react';

/* ─── Floating-label text field ──────────────────────────────────
   Shared across the whole site. The field is never auto-selected — the user
   must click it. While empty and unfocused the label sits like a placeholder
   (vertically centred for single-line inputs, near the top for textareas /
   selects); on focus (or once it holds a value) the label rises to sit ON the
   top border — its white background notches a gap in the outline.

   Variants:
     • default        → single-line <input>
     • multiline      → <textarea> (pass `multiline` + optional `rows`)
     • select         → <select> (pass `multiline={false}` is irrelevant; pass
                        `options` OR `children`); the label is always floated
                        because a native select can't show an empty placeholder
                        the same way. */

type CommonProps = {
  label: string;
  value: string;
  onValue: (v: string) => void;
  extraStyle?: React.CSSProperties;
  /** Extra style for the outer wrapper (e.g. flex sizing). */
  wrapperStyle?: React.CSSProperties;
  /** Static text shown inside the field, before the value (e.g. "barefolio.com/").
      When set, the label stays floated so it never collides with the prefix. */
  prefix?: string;
};

type InputVariant = CommonProps & {
  as?: 'input';
  type?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};

type TextareaVariant = CommonProps & {
  as: 'textarea';
  rows?: number;
  inputProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
};

type SelectVariant = CommonProps & {
  as: 'select';
  children: React.ReactNode;
  inputProps?: React.SelectHTMLAttributes<HTMLSelectElement>;
};

type FloatingFieldProps = InputVariant | TextareaVariant | SelectVariant;

export const SHARED_FIELD_STYLE: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1.5px solid',
  borderRadius: '12px',
  fontSize: '15px',
  color: '#101010',
  background: '#fff',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color .15s',
};

/* Shared floating-label style, so specialised fields (DateField, CountrySelect)
   look identical to FloatingField without duplicating the values. */
export function floatingLabelStyle({
  floated,
  focused,
  restingTop = '50%',
  restingTransform = 'translateY(-50%)',
}: {
  floated: boolean;
  focused: boolean;
  restingTop?: string;
  restingTransform?: string;
}): React.CSSProperties {
  return {
    position: 'absolute',
    left: '10px',
    top: floated ? '0' : restingTop,
    transform: floated ? 'translateY(-50%)' : restingTransform,
    padding: '0 6px',
    background: '#fff',
    fontSize: floated ? '11px' : '15px',
    fontWeight: floated ? 600 : 400,
    letterSpacing: floated ? '0.4px' : 'normal',
    textTransform: floated ? 'uppercase' : 'none',
    color: floated ? (focused ? '#101010' : '#737373') : '#a3a3a3',
    pointerEvents: 'none',
    transition: 'top .15s ease, font-size .15s ease, color .15s ease',
  };
}

export default function FloatingField(props: FloatingFieldProps) {
  const { label, value, onValue, extraStyle, wrapperStyle, prefix } = props;
  const [focused, setFocused] = useState(false);

  const isTextarea = props.as === 'textarea';
  const isSelect = props.as === 'select';
  // A native select can't render a centred placeholder, so keep its label
  // floated. A prefix occupies the field's left edge, so float there too.
  const floated = focused || value.length > 0 || isSelect || !!prefix;

  // Resting (un-floated) vertical position of the label.
  const restingTop = isTextarea ? '20px' : '50%';
  const restingTransform = isTextarea ? 'none' : 'translateY(-50%)';

  const fieldStyle: React.CSSProperties = {
    ...SHARED_FIELD_STYLE,
    borderColor: focused ? '#101010' : '#e5e5e5',
    padding: isTextarea ? '12px' : '10px 12px',
    ...(isTextarea ? { resize: 'vertical' as const } : null),
    ...(isSelect ? { appearance: 'none' as const, cursor: 'pointer' } : null),
    ...extraStyle,
  };

  const handlers = {
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  };

  return (
    <div style={{ position: 'relative', ...wrapperStyle }}>
      <label style={floatingLabelStyle({ floated, focused, restingTop, restingTransform })}>
        {label}
      </label>

      {isTextarea ? (
        <textarea
          value={value}
          onChange={e => onValue(e.target.value)}
          rows={props.rows ?? 4}
          style={fieldStyle}
          {...handlers}
          {...props.inputProps}
        />
      ) : isSelect ? (
        <select
          value={value}
          onChange={e => onValue(e.target.value)}
          style={fieldStyle}
          {...handlers}
          {...props.inputProps}
        >
          {props.children}
        </select>
      ) : (
        <>
          {prefix && (
            <span
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '15px',
                color: '#a3a3a3',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {prefix}
            </span>
          )}
          <input
            type={props.type ?? 'text'}
            value={value}
            onChange={e => onValue(e.target.value)}
            style={
              prefix
                ? { ...fieldStyle, paddingLeft: `calc(28px + ${prefix.length}ch)` }
                : fieldStyle
            }
            {...handlers}
            {...props.inputProps}
          />
        </>
      )}
    </div>
  );
}
