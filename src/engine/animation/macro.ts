/**
 * Macro backdrop: a tissue of cells built around the course's cell-overview
 * figure, so animations can zoom out from one cell to the tissue and back.
 * Deterministic (seeded) so every render looks the same.
 */
export function buildMacroSvg(cellFigureSvg: string): string {
  let seed = 11;
  const R = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  let h = '<style>.mlb{fill:#aeb5c7;font-size:15px;font-weight:700}</style><rect x="-7000" y="-5000" width="14000" height="10000" fill="#05070b"/>';
  for (let j = -3; j <= 3; j++) {
    for (let i = -5; i <= 5; i++) {
      if (!i && !j) continue;
      const x = i * 1040 + (Math.abs(j) % 2 ? 520 : 0), y = j * 680;
      let org = '';
      for (let k = 0; k < 5; k++) org += `<ellipse cx="${560 + R() * 330}" cy="${130 + R() * 380}" rx="${26 + R() * 14}" ry="12" fill="none" stroke="#24594a" stroke-width="4"/>`;
      for (let k = 0; k < 3; k++) org += `<path d="M${520 + k * 24} ${230 + R() * 30} q36 90 0 180" fill="none" stroke="#5a2430" stroke-width="7" stroke-linecap="round"/>`;
      h += `<g transform="translate(${x},${y})"><rect x="30" y="40" width="940" height="560" rx="150" fill="#0b0f17" stroke="#34405a" stroke-width="6"/><circle cx="${250 + R() * 120}" cy="${300 + R() * 90}" r="${95 + R() * 25}" fill="#121827" stroke="#4d5e82" stroke-width="5" stroke-dasharray="26 6"/>${org}</g>`;
    }
  }
  const cell = cellFigureSvg
    .replace(/^\s*<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/class="hs"/g, 'class="mc"')
    .replace(/class="lb"/g, 'class="mlb"')
    .replace(/class="shape"/g, '');
  return h + `<g>${cell}</g>`;
}
