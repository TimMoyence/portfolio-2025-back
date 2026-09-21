import { applyDecorators } from '@nestjs/common';
import { ApiForbiddenResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from '../../../common/interfaces/auth/roles.decorator';
import { ROLE_ADMINISTRATEUR } from '../domain/SessionOwnership';
import type { ActeurFormation } from '../domain/SessionOwnership';

export const ROLE_FORMATEUR = 'teacher';

const SEANCE_INTROUVABLE = 'Séance introuvable';

export function acteurDe(request: Request): ActeurFormation {
  return { id: request.user!.sub, roles: request.user!.roles };
}

export function LectureDeSeance(): MethodDecorator {
  return applyDecorators(
    Roles(ROLE_FORMATEUR, ROLE_ADMINISTRATEUR),
    ApiForbiddenResponse({
      description:
        'Séance d’un autre formateur ; un administrateur peut la lire',
    }),
    ApiNotFoundResponse({ description: SEANCE_INTROUVABLE }),
  );
}

export function PilotageDeSeance(): MethodDecorator {
  return applyDecorators(
    ApiForbiddenResponse({
      description:
        'Séance d’un autre formateur : seul le propriétaire la pilote, administrateur compris',
    }),
    ApiNotFoundResponse({ description: SEANCE_INTROUVABLE }),
  );
}
