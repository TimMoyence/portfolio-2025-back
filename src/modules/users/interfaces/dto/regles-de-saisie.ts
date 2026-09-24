import { applyDecorators } from '@nestjs/common';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { VALID_ROLES } from '../../domain/roles';

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
