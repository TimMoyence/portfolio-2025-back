import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request, Response } from 'express';

export interface EchangeHttp {
  req: Request;
  res: Response;
}

export const EchangeCourant = createParamDecorator(
  (_donnees: unknown, contexte: ExecutionContext): EchangeHttp => {
    const http = contexte.switchToHttp();
    return {
      req: http.getRequest<Request>(),
      res: http.getResponse<Response>(),
    };
  },
);
