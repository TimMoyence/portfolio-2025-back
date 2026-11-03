const ELLIPSE = '…';

export function tronquer(texte: string, max: number): string {
  const points = Array.from(texte);
  if (points.length <= max) return texte;
  const debut = points.slice(0, Math.max(0, max - 1)).join('');
  return `${debut.trimEnd()}${ELLIPSE}`;
}
