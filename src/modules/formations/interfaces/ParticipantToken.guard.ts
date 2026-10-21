import {
  applyDecorators,
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  type IdentiteSignee,
  jetonDesEntetes,
  ParticipantTokenService,
} from './ParticipantToken.service';

@Injectable()
export class ParticipantTokenGuard implements CanActivate {
  constructor(private readonly tokens: ParticipantTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requete = context.switchToHttp().getRequest<Request>();
    const identite = await this.tokens.verifierIdentite(
      String(requete.params['id'] ?? ''),
      jetonDesEntetes(requete.headers),
    );
    requete.participantId = identite.participantId;
    requete.generationDeJeton = identite.generation;
    return true;
  }
}

export function RouteParticipant(): MethodDecorator {
  return applyDecorators(
    UseGuards(ParticipantTokenGuard),
    ApiUnauthorizedResponse({ description: 'Jeton de participant invalide' }),
    ApiForbiddenResponse({
      description:
        'Participant evince par le formateur, cause dans le champ code du corps : PARTICIPANT_EVINCE',
    }),
  );
}

export const IdentiteDuJeton = createParamDecorator(
  (_donnee: unknown, contexte: ExecutionContext): IdentiteSignee => {
    const { participantId, generationDeJeton } = contexte
      .switchToHttp()
      .getRequest<Request>();
    if (participantId === undefined || generationDeJeton === undefined) {
      throw new UnauthorizedException('Jeton de participant non verifie');
    }
    return { participantId, generation: generationDeJeton };
  },
);
