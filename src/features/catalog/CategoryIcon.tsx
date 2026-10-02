/** Line icons for the medical fields (24×24, stroke = currentColor). */
import type { ReactElement } from 'react';

const P: Record<string, ReactElement> = {
  // tissue: packed cells with nuclei
  histology: (
    <>
      <path d="M7 3.5 11 6v4.5L7 13l-4-2.5V6zM17 3.5 21 6v4.5L17 13l-4-2.5V6zM12 11.5l4 2.5v4.5L12 21l-4-2.5V14z" />
      <circle cx="7" cy="8.3" r="1.1" /><circle cx="17" cy="8.3" r="1.1" /><circle cx="12" cy="16.3" r="1.1" />
    </>
  ),
  // blastocyst: ring of cells with an inner cell mass
  embryology: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="6" strokeDasharray="2.2 1.6" />
      <path d="M7.4 9.2c1.2-1.6 2.9-2.3 4.6-2.3v4.2c-1.9 0-3.6-.6-4.6-1.9z" />
    </>
  ),
  // double helix
  genetics: (
    <>
      <path d="M7 3c0 4.5 10 4.5 10 9s-10 4.5-10 9M17 3c0 4.5-10 4.5-10 9s10 4.5 10 9" />
      <path d="M8.5 6h7M9 9.5h6M9 14.5h6M8.5 18h7" />
    </>
  ),
  // cell with nucleus and organelles
  cell: (
    <>
      <ellipse cx="12" cy="12" rx="9" ry="7.5" />
      <circle cx="11" cy="11.5" r="3" />
      <path d="M16.5 8.5c1 .2 1.6.9 1.6 1.8M15.5 15.6c1.5.2 2.6-.4 3-1.4" />
      <circle cx="11" cy="11.5" r=".9" />
    </>
  ),
  // molecule
  biochemistry: (
    <>
      <path d="M12 3.5 18.5 7.2v7.6L12 18.5 5.5 14.8V7.2z" />
      <path d="M12 18.5V21M18.5 7.2 21 5.8M5.5 7.2 3 5.8" />
      <circle cx="12" cy="11" r="2.4" />
    </>
  ),
  // heartbeat
  physiology: (
    <>
      <path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.5 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z" />
      <path d="M2.5 12.5h5l1.6-2.8 2.2 5 1.7-3.2h8.5" />
    </>
  ),
  // bone
  anatomy: (
    <path d="M8.2 5.2a2.4 2.4 0 1 0-3 3l9.6 9.6a2.4 2.4 0 1 0 3 3 2.4 2.4 0 1 0 3-3 2.4 2.4 0 1 0-3-3L8.2 5.2a2.4 2.4 0 1 0-3 0" />
  ),
  // antibody (Y)
  immunology: (
    <>
      <path d="M12 21v-7.5M12 13.5 6.2 7.7M12 13.5l5.8-5.8" />
      <path d="M9.6 15.8 4.5 10.7M14.4 15.8l5.1-5.1" />
      <circle cx="5" cy="6.5" r="1.4" /><circle cx="19" cy="6.5" r="1.4" />
    </>
  ),
  // magnifier over a lesion
  pathology: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.3 15.3 5.2 5.2" />
      <path d="M8 9.3c.8-1.3 2.6-1.6 3.6-.6.9.9.4 2.6-.9 3-1.4.5-3.4-.8-2.7-2.4z" />
    </>
  ),
  // capsule
  pharmacology: (
    <>
      <rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 12)" />
      <path d="m10.1 9.3 3.8 5.4" />
    </>
  ),
  // bacterium with flagella
  microbiology: (
    <>
      <rect x="5" y="8.5" width="12" height="7" rx="3.5" />
      <path d="M17 12c1.5-1.8 2.6 1.6 4-.6M8.5 11.5h.01M12 12.5h.01M14 11h.01" />
      <path d="M5 12C3.6 10.4 3 13.3 2 12" />
    </>
  ),
  // book
  other: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5M8 7.5h8M8 11h6" />
    </>
  ),
};

export function CategoryIcon({ name, size = 26 }: { name: string; size?: number }) {
  return (
    <svg className="cat-ic" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name] ?? P.other}
    </svg>
  );
}
