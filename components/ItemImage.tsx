'use client';

import { useEffect, useState } from 'react';
import type { Item } from '@/lib/items';

type Props = { item: Item; size?: number };

/**
 * CDN 아이콘을 우선 그리고, 로딩에 실패하면 인라인 SVG로 대체한다.
 * item.imageUrl이 null이면 처음부터 인라인 SVG를 그린다.
 */
export default function ItemImage({ item, size = 140 }: Props) {
  const [failed, setFailed] = useState(false);

  // 물품이 바뀌면 실패 상태를 초기화한다.
  useEffect(() => {
    setFailed(false);
  }, [item.id]);

  const style = { width: size, height: size } as const;

  if (item.imageUrl === null || failed) {
    return (
      <span
        className="item-image"
        style={style}
        aria-label={item.name}
        role="img"
        dangerouslySetInnerHTML={{ __html: item.svg }}
      />
    );
  }

  return (
    <span className="item-image" style={style}>
      <img
        src={item.imageUrl}
        alt={item.name}
        width={size}
        height={size}
        draggable={false}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
