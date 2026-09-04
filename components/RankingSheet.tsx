'use client';

import { useState } from 'react';
import { MAX_COUNT } from '@/lib/ranking';

type Props = {
  onSubmit: (name: string, count: number) => void;
  onClose: () => void;
};

export default function RankingSheet({ onSubmit, onClose }: Props) {
  const [name, setName] = useState('');
  const [count, setCount] = useState(0);

  const canSubmit = name.trim().length > 0;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h2 className="sheet-title">기록 추가</h2>

        <input
          className="sheet-input"
          placeholder="이름"
          value={name}
          maxLength={12}
          autoFocus
          onChange={(e) => setName(e.target.value)}
        />

        <p className="sheet-label">개수</p>
        <div className="chip-row">
          {Array.from({ length: MAX_COUNT + 1 }, (_, n) => (
            <button
              key={n}
              className={`chip${n === count ? ' is-active' : ''}`}
              onClick={() => setCount(n)}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="sheet-actions">
          <button className="sheet-cancel" onClick={onClose}>취소</button>
          <button className="sheet-submit" disabled={!canSubmit} onClick={() => onSubmit(name, count)}>
            등록
          </button>
        </div>
      </div>
    </div>
  );
}
