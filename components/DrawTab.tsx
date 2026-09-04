'use client';

import { useEffect, useState } from 'react';
import SlotMachine from './SlotMachine';
import { bumpCount, type Counts } from '@/lib/draw';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';

/** 슬롯 인덱스별 카운트. 슬롯끼리 공유하지 않는다. */
type CountsBySlot = Record<string, Counts>;

/** 인원수가 적을수록 슬롯을 크게 키운다. 아이패드 화면을 채우기 위해서다. */
const SLOT_SCALE: Record<number, number> = { 1: 1.75, 2: 1.45, 3: 1.2, 4: 1.08, 5: 1 };

type Props = { playerCount: number };

export default function DrawTab({ playerCount }: Props) {
  const [countsBySlot, setCountsBySlot] = useState<CountsBySlot>({});

  useEffect(() => {
    setCountsBySlot(loadJSON<CountsBySlot>(STORAGE_KEYS.counts, {}));
  }, []);

  const handleDraw = (slot: number, itemId: string) => {
    setCountsBySlot((prev) => {
      const key = String(slot);
      const next = { ...prev, [key]: bumpCount(prev[key] ?? {}, itemId) };
      saveJSON(STORAGE_KEYS.counts, next);
      return next;
    });
  };

  return (
    <div
      className="draw-grid"
      style={
        {
          gridTemplateColumns: `repeat(${playerCount}, 1fr)`,
          '--slot-scale': SLOT_SCALE[playerCount] ?? 1,
        } as React.CSSProperties
      }
    >
      {Array.from({ length: playerCount }, (_, slot) => (
        <section className="draw-slot" key={slot}>
          {playerCount > 1 && <span className="draw-slot-label">{slot + 1}</span>}
          <SlotMachine
            counts={countsBySlot[String(slot)] ?? {}}
            onDraw={(itemId) => handleDraw(slot, itemId)}
            initialIndex={slot * 3 + 1}
          />
        </section>
      ))}
    </div>
  );
}
