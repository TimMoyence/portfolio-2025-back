import { InvalidSessionCodeError } from './errors/FormationErrors';

const CODE_PATTERN = /^[1-9]\d{3}$/;
const MIN_CODE = 1000;
const CODE_RANGE = 9000;

export const SessionCode = {
  generate(random: () => number = Math.random): string {
    const value = MIN_CODE + Math.floor(random() * CODE_RANGE);
    return String(value);
  },

  parse(value: string): string {
    if (!CODE_PATTERN.test(value)) {
      throw new InvalidSessionCodeError(value);
    }
    return value;
  },
};
