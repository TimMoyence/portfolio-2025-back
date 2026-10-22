import { applyDecorators } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { MOTIF_D_UN_TELEPHONE } from '../../domain/value-objects/PhoneNumber';
import { Motif } from './bornes-annoncees.decorator';
import { AuPlusCaracteres, Rogne } from './longueur-de-texte.decorator';

const TELEPHONE_OU_RIEN = new RegExp(`^$|${MOTIF_D_UN_TELEPHONE.source}`);

export function TelephoneOptionnel(
  exemple: string,
  max?: number,
): PropertyDecorator {
  return applyDecorators(
    ApiPropertyOptional({ type: String, example: exemple, nullable: true }),
    IsOptional(),
    Rogne(),
    IsString(),
    Motif(TELEPHONE_OU_RIEN, {
      message: ({ property }) => `${property} must be a phone number`,
    }),
    ...(max === undefined ? [] : [AuPlusCaracteres(max)]),
  );
}
