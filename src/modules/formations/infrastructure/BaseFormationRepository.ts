import { QueryFailedError } from 'typeorm';

const POSTGRES_UNIQUE_VIOLATION = '23505';

export abstract class BaseFormationRepository {
  protected isUniqueViolation(error: unknown): boolean {
    const driverCode =
      error instanceof QueryFailedError
        ? (error.driverError as { code?: string })?.code
        : undefined;
    if (driverCode === POSTGRES_UNIQUE_VIOLATION) return true;

    return (
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === POSTGRES_UNIQUE_VIOLATION
    );
  }
}
