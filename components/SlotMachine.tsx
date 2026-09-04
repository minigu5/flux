'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ITEMS } from '@/lib/items';
import { drawItem, type Counts } from '@/lib/draw';
import ItemImage from './ItemImage';

const CELL = 200;        // 릴 한 칸의 높이(px). 창 높이와 같다.
const REPEAT = 12;       // 스트립에 물품 목록을 반복할 횟수
const SPIN_MS = 1100;    // 등속 구간
const EASE_MS = 600;     // 감속 구간
const SPEED = CELL * 14; // 등속 구간 속도(px/s)
const LOOPS = 2;         // 감속 구간에서 최소로 더 도는 바퀴 수
const CYCLE = CELL * ITEMS.length;
const WRAP = CYCLE * (REPEAT - 2); // 한 사이클 배수라서 감아도 그림이 튀지 않는다.

/** 감속 곡선. 끝에서 완전히 멈춘다. */
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

const STRIP = Array.from({ length: REPEAT }, () => ITEMS).flat();

type Props = {
  counts: Counts;
  onDraw: (itemId: string) => void;
};

export default function SlotMachine({ counts, onDraw }: Props) {
  const [current, setCurrent] = useState(ITEMS[0]);
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState(false);

  const reelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // 최신 값을 애니메이션 콜백에서 읽기 위해 ref로 들고 있는다.
  const countsRef = useRef(counts);
  countsRef.current = counts;
  const onDrawRef = useRef(onDraw);
  onDrawRef.current = onDraw;

  const paint = (offset: number, blur: number) => {
    const el = reelRef.current;
    if (!el) return;
    el.style.transform = `translate3d(0, ${-(offset % WRAP)}px, 0)`;
    el.style.filter = blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : 'none';
  };

  useEffect(() => {
    paint(0, 0);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const spin = useCallback(() => {
    if (rafRef.current !== null) return;

    const winnerId = drawItem(countsRef.current);
    const winnerIndex = ITEMS.findIndex((i) => i.id === winnerId);
    const winner = ITEMS[winnerIndex];

    setSpinning(true);
    setLanded(false);

    const start = performance.now();
    const startOffset = offsetRef.current;
    const spinEndOffset = startOffset + (SPEED * SPIN_MS) / 1000;

    // 감속이 끝날 목표 오프셋: LOOPS바퀴를 더 돈 뒤 당첨 칸에 정확히 정렬한다.
    const base = spinEndOffset + CYCLE * LOOPS;
    const remainder = ((base % CYCLE) + CYCLE) % CYCLE;
    const forward = ((winnerIndex * CELL - remainder) % CYCLE + CYCLE) % CYCLE;
    const endOffset = base + forward;

    const tick = (now: number) => {
      const elapsed = now - start;

      if (elapsed < SPIN_MS) {
        const offset = startOffset + (SPEED * elapsed) / 1000;
        offsetRef.current = offset;
        paint(offset, 6);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const t = Math.min(1, (elapsed - SPIN_MS) / EASE_MS);
      const eased = easeOutQuart(t);
      const offset = spinEndOffset + (endOffset - spinEndOffset) * eased;
      offsetRef.current = offset;
      paint(offset, 6 * (1 - eased));

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // 정확히 목표 칸에 앉힌다.
      offsetRef.current = endOffset;
      paint(endOffset, 0);
      rafRef.current = null;
      setCurrent(winner);
      setSpinning(false);
      setLanded(true);
      onDrawRef.current(winnerId);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  return (
    <div className="slot">
      <div className={`slot-window${landed ? ' is-landed' : ''}`}>
        {/* 정지 시 바운스는 이 래퍼가 맡는다. 릴의 transform과 겹치면 안 된다. */}
        <div className={`slot-bounce${landed ? ' is-landed' : ''}`}>
          <div className="slot-reel" ref={reelRef}>
            {STRIP.map((item, i) => (
              <div className="slot-cell" key={`${item.id}-${i}`}>
                <ItemImage item={item} size={CELL * 0.66} />
              </div>
            ))}
          </div>
        </div>
        <div className="slot-mask" aria-hidden />
      </div>

      <p className={`slot-name${spinning ? ' is-spinning' : ''}`}>{current.name}</p>

      <button className="slot-button" onClick={spin} disabled={spinning}>
        {spinning ? '뽑는 중' : '랜덤 뽑기'}
      </button>
    </div>
  );
}
