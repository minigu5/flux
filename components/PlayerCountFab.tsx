'use client';

import { useState } from 'react';

const OPTIONS = [1, 2, 3, 4, 5];

type Props = { value: number; onChange: (n: number) => void };

export default function PlayerCountFab({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fab-wrap">
      {open && (
        <div className="fab-menu">
          {OPTIONS.map((n) => (
            <button
              key={n}
              className={`fab-option${n === value ? ' is-active' : ''}`}
              onClick={() => {
                onChange(n);
                setOpen(false);
              }}
            >
              {n}
            </button>
          ))}
        </div>
      )}
      <button className="fab" onClick={() => setOpen((v) => !v)} aria-label="인원수 조절">
        <span className="fab-value">{value}</span>
        <span className="fab-unit">명</span>
      </button>
    </div>
  );
}
