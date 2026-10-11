import {
  BadRequestException,
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { estObjet } from '../../domain/est-objet';

const DUREE_MIN_DE_SAISIE_MS = 1_200;

function piegeRempli(piege: unknown): boolean {
  if (piege === undefined || piege === null) return false;
  return typeof piege !== 'string' || piege.trim().length > 0;
}

function saisieTropRapide(debut: unknown, maintenant: number): boolean {
  if (debut === undefined || debut === null) return false;
  if (typeof debut !== 'number' || !Number.isFinite(debut)) return true;
  return maintenant - debut < DUREE_MIN_DE_SAISIE_MS;
}

@Injectable()
export class IntercepteurAntiRobot implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const { body } = context.switchToHttp().getRequest<{ body?: unknown }>();
    if (
      estObjet(body) &&
      (piegeRempli(body.website) ||
        saisieTropRapide(body.formStartedAt, Date.now()))
    ) {
      throw new BadRequestException('Invalid request');
    }
    return next.handle();
  }
}
