import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

/**
 * Filtre global d'exceptions qui formate toutes les erreurs au format RFC 7807 (Problem Details).
 *
 * - Les {@link HttpException} conservent leur status et message d'origine.
 * - Les erreurs inconnues retournent 500 avec un message generique en production.
 *
 * Note : les {@link DomainError} sont interceptees en amont par {@link DomainExceptionFilter}.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7807
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
      status(code: number): { json(body: unknown): void };
    }>();
    const request = ctx.getRequest<{ url: string }>();

    let status: number;
    let detail: string | string[];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        detail = res;
      } else {
        const body = res as Record<string, unknown>;
        detail = (body.message as string | string[]) ?? exception.message;
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      detail =
        process.env.NODE_ENV === 'production'
          ? 'Une erreur interne est survenue.'
          : exception instanceof Error
            ? exception.message
            : String(exception);
    }

    // Log complet pour les erreurs serveur
    if (status >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.message : String(exception),
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    // RFC 7807 Problem Details
    response.status(status).json({
      type: `https://httpstatuses.com/${status}`,
      title: HttpStatus[status] ?? 'Error',
      status,
      detail,
      instance: request.url,
    });
  }
}
