'use client';

import { useEffect, useState } from 'react';
import RankingSheet from './RankingSheet';
import { createEntry, formatTime, sortRanking, type RankingEntry } from '@/lib/ranking';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';

export default function RankingTab() {
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setEntries(loadJSON<RankingEntry[]>(STORAGE_KEYS.ranking, []));
  }, []);

  const persist = (next: RankingEntry[]) => {
    setEntries(next);
    saveJSON(STORAGE_KEYS.ranking, next);
  };

  const add = (name: string, count: number) => {
    persist([...entries, createEntry(name, count)]);
    setSheetOpen(false);
  };

  const remove = (id: string) => {
    const next = entries.filter((e) => e.id !== id);
    persist(next);
    if (next.length === 0) setEditing(false);
  };

  const sorted = sortRanking(entries);

  return (
    <div className="rank">
      <div className="rank-head">
        <h1 className="rank-title">랭킹</h1>
        <button
          className={`rank-edit${editing ? ' is-active' : ''}`}
          onClick={() => setEditing((v) => !v)}
          disabled={entries.length === 0}
        >
          {editing ? '완료' : '편집'}
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="rank-empty">아직 기록이 없다. 오른쪽 아래 + 버튼으로 추가한다.</p>
      ) : (
        <ol className="rank-list">
          {sorted.map((e, i) => (
            <li className={`rank-row rank-${i < 3 ? i + 1 : 'n'}`} key={e.id}>
              <span className="rank-pos">{i + 1}</span>
              <span className="rank-name">{e.name}</span>
              <span className="rank-time">{formatTime(e.createdAt)}</span>
              <span className="rank-count">{e.count}</span>
              {editing && (
                <button className="rank-del" onClick={() => remove(e.id)} aria-label={`${e.name} 삭제`}>
                  삭제
                </button>
              )}
            </li>
          ))}
        </ol>
      )}

      <button className="fab fab-plus" onClick={() => setSheetOpen(true)} aria-label="기록 추가">
        +
      </button>

      {sheetOpen && <RankingSheet onSubmit={add} onClose={() => setSheetOpen(false)} />}
    </div>
  );
}
