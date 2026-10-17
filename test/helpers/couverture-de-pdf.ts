const OUVERTURE = '<section class="page cover">';
const FERMETURE = '</section>';

export function couvertureRendue(html: string): string {
  const debut = html.indexOf(OUVERTURE);
  const fin = html.indexOf(FERMETURE, debut);
  if (debut < 0 || fin < 0) {
    throw new Error('Le document ne porte aucune couverture.');
  }
  return html
    .slice(debut, fin + FERMETURE.length)
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ');
}
