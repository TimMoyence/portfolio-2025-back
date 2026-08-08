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
import { RateLimitExceededError } from '../../domain/errors/RateLimitExceededError';
import { ResourceConflictError } from '../../domain/errors/ResourceConflictError';
import { ResourceNotFoundError } from '../../domain/errors/ResourceNotFoundError';
import { TokenExpiredError } from '../../domain/errors/TokenExpiredError';
import { TokenReuseDetectedError } from '../../domain/errors/TokenReuseDetectedError';
import { UserNotFoundError } from '../../domain/errors/UserNotFoundError';
import { httpProblemTarget } from './http-problem-target';

/**
 * @see https://www.rfc-editor.org/rfc/rfc7807
 */
@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const { response, instance } = httpProblemTarget(host);

    const status = this.resolveHttpStatus(exception);

    const body: Record<string, unknown> = {
      type: `https://httpstatuses.com/${status}`,
      title: HttpStatus[status] ?? 'Error',
      status,
      detail: exception.message,
      instance,
    };

    const code = (exception as { code?: string }).code;
    if (typeof code === 'string') {
      body.code = code;
    }

    response.status(status).json(body);
  }

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

    if (exception instanceof RateLimitExceededError) {
      return HttpStatus.TOO_MANY_REQUESTS;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
