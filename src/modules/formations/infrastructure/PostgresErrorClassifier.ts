import { QueryFailedError } from 'typeorm';

const POSTGRES_UNIQUE_VIOLATION = '23505';

interface PostgresDriverError {
  code?: string;
  constraint?: string;
}

export abstract class PostgresErrorClassifier {
  protected isUniqueViolation(error: unknown): boolean {
    return this.driverErrorOf(error)?.code === POSTGRES_UNIQUE_VIOLATION;
  }

  protected uniqueViolationConstraint(error: unknown): string | undefined {
    if (!this.isUniqueViolation(error)) return undefined;
    return this.driverErrorOf(error)?.constraint;
  }

  private driverErrorOf(error: unknown): PostgresDriverError | undefined {
    if (error instanceof QueryFailedError) {
      return error.driverError as PostgresDriverError;
    }
    if (error !== null && typeof error === 'object' && 'code' in error) {
      return error as PostgresDriverError;
    }
    return undefined;
  }
}
