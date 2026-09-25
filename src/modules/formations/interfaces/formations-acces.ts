import { applyDecorators, Controller, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from '../../../common/interfaces/auth/roles.decorator';
import { RolesGuard } from '../../../common/interfaces/auth/roles.guard';
import { ROLE_ADMINISTRATEUR } from '../domain/SessionOwnership';
import type { ActeurFormation } from '../domain/SessionOwnership';
import {
  LIMITE_LECTURE_FORMATEUR_PAR_MINUTE,
  LimiteParMinute,
} from './formations-throttling';

const ROLE_FORMATEUR = 'teacher';

const SEANCE_INTROUVABLE = 'Séance introuvable';

export function acteurDe(request: Request): ActeurFormation {
  return { id: request.user!.sub, roles: request.user!.roles };
}

export function ControleurFormateur(): ClassDecorator {
  return applyDecorators(
    ApiTags('formations'),
    ApiBearerAuth(),
    Controller('formations'),
    UseGuards(RolesGuard),
    Roles(ROLE_FORMATEUR),
  );
}

export function LectureDeSeance(): MethodDecorator {
  return applyDecorators(
    LimiteParMinute(LIMITE_LECTURE_FORMATEUR_PAR_MINUTE),
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
