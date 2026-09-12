import { randomInt } from 'node:crypto';
import { InvalidSessionCodeError } from './errors/FormationErrors';

const CODE_PATTERN = /^[1-9]\d{3}$/;
const MIN_CODE = 1000;
const CODE_RANGE = 9000;

export const SessionCode = {
  /**
   * Le tirage est cryptographique : `Math.random` (xorshift128+ dans V8)
   * laisse deduire la suite de quelques sorties observees, et deux seances
   * suivies suffiraient a un etudiant pour deviner le code de la troisieme
   * avant qu il ne soit dicte. `randomInt` de node:crypto rend le prochain
   * code independant des precedents ; la fonction reste injectable pour
   * SessionCode.spec.ts.
   */
  generate(tirage: (borne: number) => number = randomInt): string {
    return String(MIN_CODE + tirage(CODE_RANGE));
  },

  parse(value: string): string {
    if (!CODE_PATTERN.test(value)) {
      throw new InvalidSessionCodeError(value);
    }
    return value;
  },
};
