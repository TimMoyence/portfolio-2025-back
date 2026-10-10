import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { VALID_ROLES } from '../../domain/roles';
import { FORME_D_UN_JETON_EMIS } from '../../domain/TokenHash';

export function JetonDeLien(): PropertyDecorator {
  return applyDecorators(
    ApiProperty({
      example:
        '4f7ab9f3f7b3d0eaa77a4b5b0dcaea31695f15de22f22e53f35b98b0aaf3112c',
      pattern: FORME_D_UN_JETON_EMIS.source,
    }),
    IsString(),
    Matches(FORME_D_UN_JETON_EMIS, {
      message: 'Le jeton du lien est invalide.',
    }),
  );
}

export function MotDePasseRobuste(): PropertyDecorator {
  return applyDecorators(
    IsString(),
    MinLength(12, {
      message: 'Le mot de passe doit contenir au moins 12 caracteres.',
    }),
    Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
      message:
        'Le mot de passe doit contenir au moins 1 majuscule, 1 chiffre et 1 caractere special.',
    }),
  );
}

export function TelephoneOptionnel(exemple: string): PropertyDecorator {
  return applyDecorators(
    ApiPropertyOptional({ example: exemple, nullable: true, maxLength: 30 }),
    IsOptional(),
    IsString(),
    MaxLength(30),
  );
}

export function RolesValides(): PropertyDecorator {
  return applyDecorators(
    IsOptional(),
    IsArray(),
    IsString({ each: true }),
    IsIn([...VALID_ROLES], {
      each: true,
      message: 'Chaque role doit etre un role valide',
    }),
  );
}
