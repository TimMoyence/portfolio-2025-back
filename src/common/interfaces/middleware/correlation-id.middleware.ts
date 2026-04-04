import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware qui propage le correlation ID (X-Request-Id) depuis le header
 * de la requête vers le header de la réponse. Génère un UUID si absent.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId =
      (req.headers['x-request-id'] as string) ?? randomUUID();
    req.headers['x-request-id'] = correlationId;
    res.setHeader('x-request-id', correlationId);
    next();
  }
}
