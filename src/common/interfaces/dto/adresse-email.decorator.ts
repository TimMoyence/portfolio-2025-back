import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { MOTIF_D_UNE_ADRESSE_EMAIL } from '../../domain/value-objects/EmailAddress';
import { Motif } from './bornes-annoncees.decorator';

export function AdresseEmail(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({ type: String }),
    IsString(),
    Motif(MOTIF_D_UNE_ADRESSE_EMAIL, {
      message: ({ property }) => `${property} must be an email`,
    }),
  );
}
