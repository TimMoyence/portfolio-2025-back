import { BadRequestException } from '@nestjs/common';
import { DomainValidationError } from '../../domain/errors/DomainValidationError';

/** Mappe les erreurs DomainValidationError en BadRequestException. */
export function mapDomainValidation<T>(fn: () => T): T {
  try {
    return fn();
  } catch (error) {
    if (error instanceof DomainValidationError) {
      throw new BadRequestException(error.message);
    }
    throw error;
  }
}
