'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ITEMS } from '@/lib/items';
import { drawItem, type Counts } from '@/lib/draw';
import ItemImage from './ItemImage';

const CELL = 200;        // 릴 한 칸의 높이(px). 창 높이와 같다.
const REPEAT = 8;        // 스트립에 물품 목록을 반복할 횟수
const MIN_SPIN_MS = 450; // 멈추기를 눌러도 최소 이만큼은 돈다
const MAX_SPIN_MS = 12000; // 아무도 멈추지 않으면 알아서 멈춘다
const EASE_MS = 700;     // 감속 구간
const SPEED = CELL * 14; // 등속 구간 속도(px/s)
const LOOPS = 2;         // 감속 구간에서 최소로 더 도는 바퀴 수
const CYCLE = CELL * ITEMS.length;
const WRAP = CYCLE * (REPEAT - 2); // 한 사이클 배수라서 감아도 그림이 튀지 않는다.

/** 감속 곡선. 끝에서 완전히 멈춘다. */
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

const STRIP = Array.from({ length: REPEAT }, () => ITEMS).flat();

/**
 * 정지 순간 가장자리가 반짝이는 색. 기본 파랑과 같은 톤(채도 높고 밝은 색)에서 고른다.
 * CSS의 rgba()에 그대로 넣기 위해 R, G, B 숫자만 담는다.
 */
const GLOW_COLORS = [
  '12, 111, 255',   // 파랑
  '0, 194, 255',    // 하늘
  '124, 96, 255',   // 보라
  '255, 77, 157',   // 분홍
  '0, 214, 143',    // 민트
  '255, 145, 61',   // 주황
];

type Props = {
  counts: Counts;
  onDraw: (itemId: string) => void;
  /** 첫 화면에 보여줄 물품 인덱스. 슬롯마다 달라야 화면이 단조롭지 않다. */
  initialIndex?: number;
};

export default function SlotMachine({ counts, onDraw, initialIndex = 0 }: Props) {
  const [current, setCurrent] = useState(ITEMS[initialIndex % ITEMS.length]);
  const [spinning, setSpinning] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [landed, setLanded] = useState(false);
  const [glow, setGlow] = useState(GLOW_COLORS[0]);

  const reelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  // 버튼을 두 번째로 누르면 켜진다. 다음 프레임에서 감속을 시작한다.
  const stopRequestedRef = useRef(false);
  // 감속 구간에 들어갔는지. 들어간 뒤에는 추가 입력을 받지 않는다.
  const stoppingRef = useRef(false);

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
    const start = (initialIndex % ITEMS.length) * CELL;
    offsetRef.current = start;
    paint(start, 0);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // 최초 1회만 배치한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spin = useCallback(() => {
    // 두 번째 누름은 정지 요청이다. 감속이 시작된 뒤에는 무시한다.
    if (rafRef.current !== null) {
      if (!stoppingRef.current) stopRequestedRef.current = true;
      return;
    }

    stopRequestedRef.current = false;
    stoppingRef.current = false;
    setStopping(false);
    setSpinning(true);
    setLanded(false);

    const start = performance.now();
    const startOffset = offsetRef.current;

    // 감속 구간에서만 쓰는 값들. 정지 요청을 받는 순간 채워진다.
    let decelStart = 0;
    let decelFrom = 0;
    let decelTo = 0;
    let winner = ITEMS[0];
    let winnerId = '';

    /** 지금 위치에서 감속을 시작한다. 당첨 물품은 이 시점에 정한다. */
    const beginStop = (now: number) => {
      winnerId = drawItem(countsRef.current);
      const winnerIndex = ITEMS.findIndex((i) => i.id === winnerId);
      winner = ITEMS[winnerIndex];

      decelStart = now;
      decelFrom = offsetRef.current;

      // LOOPS바퀴를 더 돈 뒤 당첨 칸에 정확히 정렬한다.
      const base = decelFrom + CYCLE * LOOPS;
      const remainder = ((base % CYCLE) + CYCLE) % CYCLE;
      const forward = (((winnerIndex * CELL - remainder) % CYCLE) + CYCLE) % CYCLE;
      decelTo = base + forward;

      stoppingRef.current = true;
      setStopping(true);
    };

    /** 릴을 목표 칸에 앉히고 뽑기를 마무리한다. */
    const finish = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      stoppingRef.current = false;
      offsetRef.current = decelTo;
      paint(decelTo, 0);
      setCurrent(winner);
      setSpinning(false);
      setStopping(false);
      setGlow(GLOW_COLORS[Math.floor(Math.random() * GLOW_COLORS.length)]);
      setLanded(true);
      onDrawRef.current(winnerId);
    };

    const tick = (now: number) => {
      const elapsed = now - start;

      // 등속 구간. 멈추기를 누를 때까지 계속 돈다.
      if (!stoppingRef.current) {
        const offset = startOffset + (SPEED * elapsed) / 1000;
        offsetRef.current = offset;
        paint(offset, 6);

        const wantStop = stopRequestedRef.current && elapsed >= MIN_SPIN_MS;
        if (wantStop || elapsed >= MAX_SPIN_MS) beginStop(now);

        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // 감속 구간.
      const t = Math.min(1, (now - decelStart) / EASE_MS);
      const eased = easeOutQuart(t);
      const offset = decelFrom + (decelTo - decelFrom) * eased;
      offsetRef.current = offset;
      paint(offset, 6 * (1 - eased));

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      finish();
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  return (
    <div className="slot">
      <div className="slot-inner">
      <div
        className={`slot-window${landed ? ' is-landed' : ''}`}
        style={{ '--glow-rgb': glow } as React.CSSProperties}
      >
        {/* 뽑는 동안 뒤에서 은은하게 도는 무지개 빛. */}
        <div className={`slot-aura${spinning ? ' is-spinning' : ''}`} aria-hidden />
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

      <button
        className={`slot-button${spinning && !stopping ? ' is-stop' : ''}`}
        onClick={spin}
        disabled={stopping}
      >
        {stopping ? '뽑는 중' : spinning ? '멈추기' : '랜덤 뽑기'}
      </button>
      </div>
    </div>
  );
}
