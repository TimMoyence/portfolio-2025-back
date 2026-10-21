const LETTRES =
  'A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u167F\\u1681-\\u1FFF' +
  '\\u2C00-\\u2DFF\\u2E80-\\u2FDF\\u3040-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFEFE\\uFF10-\\uFFEF';
const ALPHANUMERIQUES = `${LETTRES}0-9`;
const MORCEAU_LOCAL = `[${ALPHANUMERIQUES}!#$%&'*+/=?^_\`{|}~-]+`;
const LABEL = `[${ALPHANUMERIQUES}](?:[${ALPHANUMERIQUES}-]{0,61}[${ALPHANUMERIQUES}])?`;
const PREMIER_NIVEAU = `(?:[${LETTRES}]{2,63}|xn--[A-Za-z0-9-]{2,59})`;

const LONGUEUR_MAX_D_UNE_ADRESSE = 254;

export const MOTIF_D_UNE_ADRESSE_EMAIL = new RegExp(
  `^(?=[^@]{1,64}@)(?=.{1,${LONGUEUR_MAX_D_UNE_ADRESSE}}$)` +
    `${MORCEAU_LOCAL}(?:\\.${MORCEAU_LOCAL})*@(?:${LABEL}\\.)+${PREMIER_NIVEAU}$`,
);

export class EmailAddress {
  private constructor(private readonly normalizedValue: string) {}

  static parse(raw: unknown): EmailAddress | null {
    if (typeof raw !== 'string') return null;

    const value = raw.trim().toLowerCase();
    if (!MOTIF_D_UNE_ADRESSE_EMAIL.test(value)) return null;

    return new EmailAddress(value);
  }

  get value(): string {
    return this.normalizedValue;
  }
}
