import { domainToASCII } from 'node:url';

const DOMAINES_GMAIL = new Set(['gmail.com', 'googlemail.com']);
const PARTIE_LOCALE_ENTRE_GUILLEMETS = /^"(.*)"$/s;

function sansGuillemets(partieLocale: string): string {
  const citee = PARTIE_LOCALE_ENTRE_GUILLEMETS.exec(partieLocale);
  return citee === null ? partieLocale : citee[1].replace(/\\(.)/gs, '$1');
}

export function boiteDeLivraison(adresse: string): string {
  const minuscule = adresse.toLowerCase();
  const arobase = minuscule.lastIndexOf('@');
  if (arobase < 0) return minuscule;

  const saisi = minuscule.slice(arobase + 1);
  const domaine = domainToASCII(saisi) || saisi;
  const partieLocale = sansGuillemets(minuscule.slice(0, arobase));
  const avantLaSousAdresse = partieLocale.split('+')[0];
  const boite = avantLaSousAdresse === '' ? partieLocale : avantLaSousAdresse;

  return DOMAINES_GMAIL.has(domaine)
    ? `${boite.replaceAll('.', '')}@gmail.com`
    : `${boite}@${domaine}`;
}
