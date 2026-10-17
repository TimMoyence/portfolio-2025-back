import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { Motif } from '../../../../common/interfaces/dto/bornes-annoncees.decorator';
import {
  AuMoinsCaracteres,
  AuPlusCaracteres,
  Rogne,
  TexteSaisi,
} from '../../../../common/interfaces/dto/longueur-de-texte.decorator';
import { VALID_ROLES } from '../../domain/roles';
import { FORME_D_UN_JETON_EMIS } from '../../domain/TokenHash';
import { LONGUEUR_MAX_D_UN_NOM } from '../../domain/User';

export const DOCUMENTATION_D_UN_JETON_DE_LIEN = {
  type: String,
  example: '4f7ab9f3f7b3d0eaa77a4b5b0dcaea31695f15de22f22e53f35b98b0aaf3112c',
  pattern: FORME_D_UN_JETON_EMIS.source,
};

const LONGUEUR_MAX_D_UN_MOT_DE_PASSE = 256;

const MotDePasseBorne = (): PropertyDecorator =>
  AuPlusCaracteres(LONGUEUR_MAX_D_UN_MOT_DE_PASSE, {
    message: 'Le mot de passe est trop long.',
  });

export function MotDePasseSaisi(): PropertyDecorator {
  return applyDecorators(
    IsString(),
    AuMoinsCaracteres(1, { message: 'Le mot de passe est requis.' }),
    MotDePasseBorne(),
  );
}

export function MotDePasseRobuste(): PropertyDecorator {
  return applyDecorators(
    IsString(),
    AuMoinsCaracteres(12, {
      message: 'Le mot de passe doit contenir au moins 12 caracteres.',
    }),
    MotDePasseBorne(),
    Motif(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
      message:
        'Le mot de passe doit contenir au moins 1 majuscule, 1 chiffre et 1 caractere special.',
    }),
  );
}

export function NomDeCompte(
  libelle: string,
  exemple: string,
  facultatif = false,
): PropertyDecorator {
  const documentation = {
    example: exemple,
    minLength: 1,
    maxLength: LONGUEUR_MAX_D_UN_NOM,
  };
  return applyDecorators(
    ...(facultatif
      ? [ApiPropertyOptional(documentation), IsOptional()]
      : [ApiProperty(documentation)]),
    TexteSaisi(1, LONGUEUR_MAX_D_UN_NOM, {
      min: `${libelle} doit contenir au moins 1 caractere.`,
      max: `${libelle} doit contenir au plus ${LONGUEUR_MAX_D_UN_NOM} caracteres.`,
    }),
  );
}

export function TelephoneOptionnel(exemple: string): PropertyDecorator {
  return applyDecorators(
    ApiPropertyOptional({
      type: String,
      example: exemple,
      nullable: true,
      maxLength: 30,
    }),
    IsOptional(),
    Rogne(),
    IsString(),
    AuPlusCaracteres(30),
  );
}

export function RolesValides(): PropertyDecorator {
  return applyDecorators(
    ApiPropertyOptional({
      example: ['teacher'],
      isArray: true,
      enum: [...VALID_ROLES],
      description: 'Liste des roles. Reserve aux administrateurs.',
    }),
    IsOptional(),
    IsArray(),
    IsString({ each: true }),
    IsIn([...VALID_ROLES], {
      each: true,
      message: 'Chaque role doit etre un role valide',
    }),
  );
}
