/** Minimal line icons (24×24, currentColor). */
const P: Record<string, string> = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v10h13V10',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5',
  play: 'M7 4.5v15l12-7.5z',
  quiz: 'M4 4h16v16H4zM8 9h8M8 13h8M8 17h5',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0-3.2a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  back: 'M15 18l-6-6 6-6',
  pause: 'M7 4h3.5v16H7zM13.5 4H17v16h-3.5z',
  replay: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
  rew: 'M11 17 5 12l6-5v10zM19 17l-6-5 6-5v10z',
  fwd: 'M13 7l6 5-6 5V7zM5 7l6 5-6 5V7z',
  prev: 'M6 5v14M19 5 9 12l10 7z',
  next: 'M18 5v14M5 5l10 7-10 7z',
  vol: 'M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14',
  mute: 'M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6',
  cc: 'M3 5h18v14H3zM10 10.5a2 2 0 1 0 0 3M16 10.5a2 2 0 1 0 0 3',
  full: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  film: 'M4 3h16v18H4zM8 3v18M16 3v18M4 8h4M4 13h4M16 8h4M16 13h4',
  micro: 'M6 21h12M9 18h6M12 18v-4M9 3l6 6-5 5-6-6zM14 12a5 5 0 0 1-2 6',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  check: 'M5 12.5l4.5 4.5L19 7',
  x: 'M6 6l12 12M18 6 6 18',
};

export function Icon({ name, size = 20, title }: { name: keyof typeof P | string; size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      <path d={P[name] || ''} />
    </svg>
  );
}
