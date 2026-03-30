import { DomainValidationError } from '../errors/DomainValidationError';

/** Value Object representant un slug URL valide (2-120 caracteres, a-z0-9 et tirets). */
export class Slug {
  private constructor(private readonly value: string) {}

  static parse(raw: unknown, field: string): Slug {
    if (typeof raw !== 'string')
      throw new DomainValidationError(`Invalid ${field}`);
    const slug = raw.trim().toLowerCase();
    if (slug.length < 2 || slug.length > 120)
      throw new DomainValidationError(`Invalid ${field}`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
      throw new DomainValidationError(`Invalid ${field}`);
    return new Slug(slug);
  }

  toString(): string {
    return this.value;
  }
}
