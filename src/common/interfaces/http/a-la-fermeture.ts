import type { ExecutionContext } from '@nestjs/common';
import { SSE_METADATA } from '@nestjs/common/constants';
import type { Response } from 'express';

export function aLaFermeture(
  context: ExecutionContext,
  rappel: (abandonnee: boolean) => void,
): void {
  const reponse = context.switchToHttp().getResponse<Response>();
  const flux = Reflect.getMetadata(SSE_METADATA, context.getHandler()) === true;
  const fermer = (): void => rappel(!flux && !reponse.writableFinished);
  if (reponse.destroyed) fermer();
  else reponse.once('close', fermer);
}
