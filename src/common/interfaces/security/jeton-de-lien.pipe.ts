import { Param, type PipeTransform, Query } from '@nestjs/common';
import { ApiNotFoundResponse } from '@nestjs/swagger';
import { FORME_D_UN_JETON_EMIS } from '../../domain/crypto/TokenHash';
import { MESSAGE_DE_LIEN_INVALIDE } from '../../domain/errors/LienInvalideError';
import { jetonDeLien, PARAMETRE_DU_JETON } from '../../domain/lien-avec-jeton';

export const SEGMENT_DU_JETON = `:${PARAMETRE_DU_JETON}`;

export const DOCUMENTATION_D_UN_JETON_DE_LIEN = {
  type: String,
  example: '4f7ab9f3f7b3d0eaa77a4b5b0dcaea31695f15de22f22e53f35b98b0aaf3112c',
  pattern: FORME_D_UN_JETON_EMIS.source,
};

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export class JetonDeLienPipe implements PipeTransform<unknown, string> {
  constructor(private readonly forme: RegExp = UUID_V4) {}

  transform(valeur: unknown): string {
    return jetonDeLien(valeur, this.forme);
  }
}

export function JetonDuLienEnRequete(forme?: RegExp): ParameterDecorator {
  return Query(PARAMETRE_DU_JETON, new JetonDeLienPipe(forme));
}

export function JetonDuLienEnChemin(): ParameterDecorator {
  return Param(PARAMETRE_DU_JETON, new JetonDeLienPipe());
}

export function RefusDeLienDocumente(): MethodDecorator {
  return ApiNotFoundResponse({ description: MESSAGE_DE_LIEN_INVALIDE });
}
