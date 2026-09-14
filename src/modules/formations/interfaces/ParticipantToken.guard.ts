import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  EN_TETE_JETON,
  ParticipantTokenService,
} from './ParticipantToken.service';

@Injectable()
export class ParticipantTokenGuard implements CanActivate {
  constructor(private readonly tokens: ParticipantTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const requete = context.switchToHttp().getRequest<Request>();
    const brut = requete.headers[EN_TETE_JETON];
    const jeton = Array.isArray(brut) ? brut[0] : brut;
    this.tokens.verify(String(requete.params['id'] ?? ''), jeton);
    return true;
  }
}
