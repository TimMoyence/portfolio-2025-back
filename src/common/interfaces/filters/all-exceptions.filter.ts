import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { messageDErreur } from '../../domain/errors/message-d-erreur';
import {
  estDependanceInjoignable,
  MESSAGE_DEPENDANCE_INJOIGNABLE,
} from './dependency-outage';
import { httpProblemTarget } from './http-problem-target';

/**
 * Note : les {@link DomainError} sont interceptees en amont par {@link DomainExceptionFilter}.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7807
 */
function internalErrorDetail(exception: unknown): string {
  if (process.env.NODE_ENV === 'production') {
    return 'Une erreur interne est survenue.';
  }
  return messageDErreur(exception);
}

function erreurClientExposee(
  exception: unknown,
): { status: number; message: string } | undefined {
  if (!(exception instanceof Error)) {
    return undefined;
  }
  const { expose, status } = exception as {
    expose?: unknown;
    status?: unknown;
  };
  if (
    expose !== true ||
    typeof status !== 'number' ||
    status < 400 ||
    status >= 500
  ) {
    return undefined;
  }
  return { status, message: exception.message };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const { response, instance } = httpProblemTarget(host);

    let status: number;
    let detail: string | string[];
    const exposee = erreurClientExposee(exception);

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        detail = res;
      } else {
        const body = res as Record<string, unknown>;
        detail = (body.message as string | string[]) ?? exception.message;
      }
    } else if (exposee) {
      status = exposee.status;
      detail = exposee.message;
    } else if (estDependanceInjoignable(exception)) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      detail = MESSAGE_DEPENDANCE_INJOIGNABLE;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      detail = internalErrorDetail(exception);
    }

    if (status >= 500) {
      this.logger.error(
        messageDErreur(exception),
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      type: `https://httpstatuses.com/${status}`,
      title: HttpStatus[status] ?? 'Error',
      status,
      detail,
      instance,
    });
  }
}
