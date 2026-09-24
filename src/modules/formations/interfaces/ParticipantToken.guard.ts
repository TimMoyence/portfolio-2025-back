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

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requete = context.switchToHttp().getRequest<Request>();
    const brut = requete.headers[EN_TETE_JETON];
    const jeton = Array.isArray(brut) ? brut[0] : brut;
    const identite = await this.tokens.verifierIdentite(
      String(requete.params['id'] ?? ''),
      jeton,
    );
    requete.participantId = identite.participantId;
    requete.generationDeJeton = identite.generation;
    return true;
  }
}
