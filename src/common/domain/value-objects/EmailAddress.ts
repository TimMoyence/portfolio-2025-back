type Plage = readonly [number, number];

const INVISIBLE = /[\p{Cc}\p{Cf}\p{Z}\p{Co}\p{Cs}]/u;
const PLEINE_CHASSE = /[！-～]/;

const echappe = (point: number): string =>
  `\\u${point.toString(16).toUpperCase().padStart(4, '0')}`;

const intervalle = (debut: number, fin: number): string =>
  debut === fin ? echappe(debut) : `${echappe(debut)}-${echappe(fin)}`;

function classeVisible(plages: readonly Plage[], refuse?: RegExp): string {
  const admis = (point: number): boolean => {
    const caractere = String.fromCharCode(point);
    return (
      plages.some(([debut, fin]) => debut <= point && point <= fin) &&
      !INVISIBLE.test(caractere) &&
      refuse?.test(caractere) !== true
    );
  };
  let classe = '';
  let ouverte: number | null = null;
  for (let point = 0xa1; point <= 0x10000; point += 1) {
    if (point <= 0xffff && admis(point)) {
      ouverte ??= point;
    } else if (ouverte !== null) {
      classe += intervalle(ouverte, point - 1);
      ouverte = null;
    }
  }
  return classe;
}

const HORS_ASCII_LOCAL = classeVisible([
  [0xa1, 0xd7ff],
  [0xf900, 0xfdcf],
  [0xfdf0, 0xffef],
]);
const HORS_ASCII_DU_DOMAINE = classeVisible([[0xa1, 0xffff]], PLEINE_CHASSE);
const HORS_ASCII_DU_PREMIER_NIVEAU = classeVisible(
  [
    [0xa1, 0xa8],
    [0xaa, 0xd7ff],
    [0xf900, 0xfdcf],
    [0xfdf0, 0xffef],
  ],
  PLEINE_CHASSE,
);

const MORCEAU_LOCAL = `[A-Za-z0-9!#$%&'*+/=?^_\`{|}~${HORS_ASCII_LOCAL}-]+`;
const CARACTERE_DE_LABEL = `A-Za-z0-9${HORS_ASCII_DU_DOMAINE}`;
const LABEL = `[${CARACTERE_DE_LABEL}](?:[${CARACTERE_DE_LABEL}-]{0,61}[${CARACTERE_DE_LABEL}])?`;
const PREMIER_NIVEAU = `(?:[A-Za-z${HORS_ASCII_DU_PREMIER_NIVEAU}]{2,63}|xn--[A-Za-z0-9-]{2,59})`;

const LONGUEUR_MAX_D_UNE_ADRESSE = 254;

export const MOTIF_D_UNE_ADRESSE_EMAIL = new RegExp(
  `^(?=[^@]{1,64}@)(?=.{1,${LONGUEUR_MAX_D_UNE_ADRESSE}}$)` +
    `${MORCEAU_LOCAL}(?:\\.${MORCEAU_LOCAL})*@(?:${LABEL}\\.)+${PREMIER_NIVEAU}$`,
);

export function normaliserUneAdresse(raw: string): string {
  return raw.trim().toLowerCase();
}

export class EmailAddress {
  private constructor(private readonly normalizedValue: string) {}

  static parse(raw: unknown): EmailAddress | null {
    if (typeof raw !== 'string') return null;

    const value = normaliserUneAdresse(raw);
    if (!MOTIF_D_UNE_ADRESSE_EMAIL.test(value)) return null;

    return new EmailAddress(value);
  }

  get value(): string {
    return this.normalizedValue;
  }
}
