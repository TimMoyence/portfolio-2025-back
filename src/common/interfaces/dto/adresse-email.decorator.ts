import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { MOTIF_D_UNE_ADRESSE_EMAIL } from '../../domain/value-objects/EmailAddress';

export function AdresseEmail(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({ type: String, pattern: MOTIF_D_UNE_ADRESSE_EMAIL.source }),
    IsString(),
    Matches(MOTIF_D_UNE_ADRESSE_EMAIL, {
      message: ({ property }) => `${property} must be an email`,
    }),
  );
}
