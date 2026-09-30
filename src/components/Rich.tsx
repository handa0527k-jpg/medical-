import type { ElementType } from 'react';

/** Typographic touch-ups for chemistry/units used across the content. */
export const fm = (t: string) =>
  String(t)
    .replace(/³H/g, '<sup>3</sup>H')
    .replace(/H₂O₂/g, 'H<sub>2</sub>O<sub>2</sub>')
    .replace(/Ca²⁺/g, 'Ca<sup>2+</sup>')
    .replace(/Mg²⁺/g, 'Mg<sup>2+</sup>')
    .replace(/H⁺/g, 'H<sup>+</sup>')
    .replace(/K⁺/g, 'K<sup>+</sup>');

/**
 * Renders trusted course markup (<b>, <sup>, <sub>, <em>, <br> only — content
 * is authored in this repository, never user input).
 */
export function Rich({ html, as: Tag = 'span', className }: { html: string; as?: ElementType; className?: string }) {
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: fm(html) }} />;
}
