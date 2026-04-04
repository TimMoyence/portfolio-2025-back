import {
  Catch,
  type ExceptionFilter,
  type ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { DomainError } from '../../domain/errors/DomainError';
import { DomainValidationError } from '../../domain/errors/DomainValidationError';
import { InvalidCredentialsError } from '../../domain/errors/InvalidCredentialsError';
import { InsufficientPermissionsError } from '../../domain/errors/InsufficientPermissionsError';
import { InvalidInputError } from '../../domain/errors/InvalidInputError';
import { ResourceConflictError } from '../../domain/errors/ResourceConflictError';
import { ResourceNotFoundError } from '../../domain/errors/ResourceNotFoundError';
import { TokenExpiredError } from '../../domain/errors/TokenExpiredError';
import { TokenReuseDetectedError } from '../../domain/errors/TokenReuseDetectedError';
import { UserNotFoundError } from '../../domain/errors/UserNotFoundError';

/**
 * Filtre global qui intercepte les {@link DomainError} et les mappe
 * vers le code HTTP correspondant au format RFC 7807 (Problem Details).
 *
 * @see https://www.rfc-editor.org/rfc/rfc7807
 */
@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
      status(code: number): { json(body: unknown): void };
    }>();
    const request = ctx.getRequest<{ url: string }>();

    const status = this.resolveHttpStatus(exception);

    response.status(status).json({
      type: `https://httpstatuses.com/${status}`,
      title: HttpStatus[status] ?? 'Error',
      status,
      detail: exception.message,
      instance: request.url,
    });
  }

  /** Determine le code HTTP a partir du type d'erreur domaine. */
  private resolveHttpStatus(exception: DomainError): number {
    if (
      exception instanceof UserNotFoundError ||
      exception instanceof ResourceNotFoundError
    ) {
      return HttpStatus.NOT_FOUND;
    }

    if (
      exception instanceof InvalidCredentialsError ||
      exception instanceof TokenExpiredError ||
      exception instanceof TokenReuseDetectedError
    ) {
      return HttpStatus.UNAUTHORIZED;
    }

    if (exception instanceof InsufficientPermissionsError) {
      return HttpStatus.FORBIDDEN;
    }

    if (
      exception instanceof InvalidInputError ||
      exception instanceof DomainValidationError
    ) {
      return HttpStatus.BAD_REQUEST;
    }

    if (exception instanceof ResourceConflictError) {
      return HttpStatus.CONFLICT;
    }

    // Fallback pour les DomainError non mappees
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
