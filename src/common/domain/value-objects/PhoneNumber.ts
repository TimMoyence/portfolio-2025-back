const SEPARATEURS = '[\\s().-]*';
const CHIFFRES = `(?:\\d${SEPARATEURS}){6,15}`;

export const MOTIF_D_UN_TELEPHONE = new RegExp(
  `^${SEPARATEURS}(?:\\+${SEPARATEURS}${CHIFFRES}|0${SEPARATEURS}0${SEPARATEURS}${CHIFFRES}|(?!0${SEPARATEURS}0)${CHIFFRES})$`,
);

export class PhoneNumber {
  private constructor(private readonly normalizedValue: string) {}

  static parse(raw: unknown): PhoneNumber | null {
    if (typeof raw !== 'string') return null;

    const trimmed = raw.trim();
    if (!MOTIF_D_UN_TELEPHONE.test(trimmed)) return null;

    const compact = trimmed.replace(/[\s().-]/g, '');
    return new PhoneNumber(
      compact.startsWith('00') ? `+${compact.slice(2)}` : compact,
    );
  }

  get value(): string {
    return this.normalizedValue;
  }
}
