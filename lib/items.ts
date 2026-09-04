export type Item = {
  id: string;
  name: string;
  /** Iconify CDN 링크. 세트에 없는 물품은 null이고 인라인 SVG만 쓴다. */
  imageUrl: string | null;
  /** CDN 실패 시 대체할 인라인 SVG 마크업. */
  svg: string;
};

const CDN = 'https://api.iconify.design/streamline-freehand-color';
const cdn = (name: string) => `${CDN}/${name}.svg?height=320`;

/** 폴백 SVG 공통 껍데기. 선 #020202, 액센트 #0c6fff, viewBox 24 기준이다. */
const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#020202" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

const SCISSORS = svg(
  '<path d="M6.2 3.1 16.2 17.3"/><path d="M17.8 3.1 7.8 17.3"/>' +
    '<circle cx="6.6" cy="19.1" r="2.6" stroke="#0c6fff"/>' +
    '<circle cx="17.4" cy="19.1" r="2.6" stroke="#0c6fff"/>' +
    '<circle cx="12" cy="14.2" r="0.9"/>',
);

const GLUE = svg(
  '<path d="M8.6 10.2h6.8c.6 0 1.1.5 1.1 1.1v8.4c0 .6-.5 1.1-1.1 1.1H8.6c-.6 0-1.1-.5-1.1-1.1v-8.4c0-.6.5-1.1 1.1-1.1Z"/>' +
    '<path d="M10.4 10.2 11 6.5h2l.6 3.7"/>' +
    '<path d="M11 6.5 11.4 3.5h1.2l.4 3"/>' +
    '<path stroke="#0c6fff" d="M9.5 14.4h5M9.5 17h5"/>',
);

const RULER = svg(
  '<g transform="rotate(-35 12 12)">' +
    '<path d="M3.4 9.4h17.2c.6 0 1 .4 1 1v3.2c0 .6-.4 1-1 1H3.4c-.6 0-1-.4-1-1v-3.2c0-.6.4-1 1-1Z"/>' +
    '<path stroke="#0c6fff" d="M6.4 9.4v2M9.2 9.4v2.8M12 9.4v2M14.8 9.4v2.8M17.6 9.4v2"/>' +
    '</g>',
);

const BOOKLET = svg(
  '<path d="M5.7 3.9h13.6c.7 0 1.2.6 1.2 1.3v14.6c0 .7-.5 1.3-1.2 1.3H5.7c-.7 0-1.2-.6-1.2-1.3V5.2c0-.7.5-1.3 1.2-1.3Z"/>' +
    '<path d="M8.4 3.9v17.2"/>' +
    '<path d="M3.1 6.4h5.4M3.1 9.6h5.4M3.1 12.8h5.4M3.1 16h5.4"/>' +
    '<path stroke="#0c6fff" d="M11.2 7.4h6c.5 0 .8.4.8.8v3.2c0 .5-.3.8-.8.8h-6c-.5 0-.8-.3-.8-.8V8.2c0-.4.3-.8.8-.8Z"/>',
);

const ERASER = svg(
  '<g transform="rotate(-38 12 12)">' +
    '<path d="M5.2 7.2h13.6c.8 0 1.4.6 1.4 1.4v5.6c0 .8-.6 1.4-1.4 1.4H5.2c-.8 0-1.4-.6-1.4-1.4V8.6c0-.8.6-1.4 1.4-1.4Z"/>' +
    '<path d="M11.4 7.2v8.4"/>' +
    '</g>' +
    '<path stroke="#0c6fff" d="M3.6 20.6c1.7-1 3.3.6 5-.4s3 .5 4.6-.4"/>',
);

const PENCIL = svg(
  '<path d="M19.7 7.2 9 17.9l-4.2 1.6 1.6-4.2L17.1 4.6Z"/>' +
    '<path d="M6.4 15.3 9 17.9"/>' +
    '<path stroke="#0c6fff" d="m17.1 4.6 1.4-1.4a1.9 1.9 0 0 1 2.7 2.7l-1.5 1.3"/>',
);

const CALCULATOR = svg(
  '<path d="M6.4 2.6h11.2c1 0 1.8.8 1.8 1.8v15.2c0 1-.8 1.8-1.8 1.8H6.4c-1 0-1.8-.8-1.8-1.8V4.4c0-1 .8-1.8 1.8-1.8Z"/>' +
    '<path stroke="#0c6fff" d="M8 5h8c.5 0 .8.4.8.8v2.6c0 .4-.3.8-.8.8H8c-.5 0-.8-.4-.8-.8V5.8c0-.4.3-.8.8-.8Z"/>' +
    '<path stroke-width="2.1" d="M8.3 12.4h.01M12 12.4h.01M15.7 12.4h.01M8.3 15.3h.01M12 15.3h.01M15.7 15.3h.01M8.3 18.2h.01M12 18.2h.01M15.7 18.2h.01"/>',
);

const GLASSES_CASE = svg(
  '<path d="M4.3 8.7h15.4c1.3 0 2.3 1 2.3 2.3v2.6c0 1.3-1 2.3-2.3 2.3H4.3C3 15.9 2 14.9 2 13.6V11c0-1.3 1-2.3 2.3-2.3Z"/>' +
    '<path d="M2.4 11.5h19.2"/>' +
    '<path stroke="#0c6fff" d="M10.5 12.1h3c.4 0 .7.3.7.7v1.6c0 .4-.3.7-.7.7h-3c-.4 0-.7-.3-.7-.7v-1.6c0-.4.3-.7.7-.7Z"/>',
);

const ECLIPSE_TIN = svg(
  '<path d="M7.4 6.9h9.2c.8 0 1.4.6 1.4 1.4v11.2c0 .8-.6 1.4-1.4 1.4H7.4c-.8 0-1.4-.6-1.4-1.4V8.3c0-.8.6-1.4 1.4-1.4Z"/>' +
    '<path d="M9.1 6.9V4.6c0-.7.6-1.3 1.3-1.3h3.2c.7 0 1.3.6 1.3 1.3v2.3"/>' +
    '<path stroke="#0c6fff" d="M6.1 11.4h11.8M6.1 15.3h11.8"/>',
);

const LEAD_CASE = svg(
  '<path d="M9.3 7.1h5.4c.6 0 1 .5 1 1v11.6c0 .6-.4 1-1 1H9.3c-.6 0-1-.4-1-1V8.1c0-.5.4-1 1-1Z"/>' +
    '<path d="M8.7 7.1V4.5c0-.6.5-1.1 1.1-1.1h4.4c.6 0 1.1.5 1.1 1.1v2.6"/>' +
    '<path stroke="#0c6fff" d="M10.5 10v7.6M12 9.8v7.9M13.5 10.1v7.4"/>',
);

export const ITEMS: readonly Item[] = [
  { id: 'scissors', name: '가위', imageUrl: cdn('copy-paste-cut-scissors'), svg: SCISSORS },
  { id: 'glue', name: '풀', imageUrl: cdn('design-tool-liquid-glue'), svg: GLUE },
  { id: 'ruler', name: '자', imageUrl: cdn('ruler-t'), svg: RULER },
  { id: 'booklet', name: '책자', imageUrl: cdn('notes-book'), svg: BOOKLET },
  { id: 'eraser', name: '지우개', imageUrl: cdn('text-formating-eraser-2'), svg: ERASER },
  { id: 'pencil', name: '연필', imageUrl: cdn('edit-pencil'), svg: PENCIL },
  { id: 'calculator', name: '공학용계산기', imageUrl: cdn('accounting-calculator'), svg: CALCULATOR },
  { id: 'glasses-case', name: '안경집', imageUrl: null, svg: GLASSES_CASE },
  { id: 'eclipse-tin', name: '이클립스 통', imageUrl: null, svg: ECLIPSE_TIN },
  { id: 'lead-case', name: '샤프심 통', imageUrl: null, svg: LEAD_CASE },
] as const;

export const ITEM_COUNT = ITEMS.length;
