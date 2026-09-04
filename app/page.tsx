'use client';

import { useEffect, useState } from 'react';
import TopBar, { type Tab } from '@/components/TopBar';
import DrawTab from '@/components/DrawTab';
import RankingTab from '@/components/RankingTab';
import PlayerCountFab from '@/components/PlayerCountFab';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';

export default function Page() {
  const [tab, setTab] = useState<Tab>('draw');
  const [playerCount, setPlayerCount] = useState(1);

  useEffect(() => {
    const saved = loadJSON<number>(STORAGE_KEYS.playerCount, 1);
    if (Number.isInteger(saved) && saved >= 1 && saved <= 5) setPlayerCount(saved);
  }, []);

  const changePlayerCount = (n: number) => {
    setPlayerCount(n);
    saveJSON(STORAGE_KEYS.playerCount, n);
  };

  return (
    <main className="app">
      <TopBar tab={tab} onChange={setTab} />
      {tab === 'draw' ? <DrawTab playerCount={playerCount} /> : <RankingTab />}
      {tab === 'draw' && <PlayerCountFab value={playerCount} onChange={changePlayerCount} />}
    </main>
  );
}
