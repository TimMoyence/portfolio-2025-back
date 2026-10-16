import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  buildMessage,
  IsString,
  ValidateBy,
  type ValidationOptions,
} from 'class-validator';
import { longueurDeTexte } from '../../domain/texte/longueur-de-texte';

const borneDeLongueur = (
  nom: 'minLength' | 'maxLength',
  borne: number,
  accepte: (longueur: number) => boolean,
  message: string,
  options?: ValidationOptions,
): PropertyDecorator =>
  applyDecorators(
    ApiProperty(
      nom === 'minLength' ? { minLength: borne } : { maxLength: borne },
    ),
    ValidateBy(
      {
        name: nom,
        constraints: [borne],
        validator: {
          validate: (valeur: unknown) =>
            typeof valeur === 'string' && accepte(longueurDeTexte(valeur)),
          defaultMessage: buildMessage(
            (prefixe) => `${prefixe}$property ${message}`,
            options,
          ),
        },
      },
      options,
    ),
  );

export const AuMoinsCaracteres = (
  min: number,
  options?: ValidationOptions,
): PropertyDecorator =>
  borneDeLongueur(
    'minLength',
    min,
    (longueur) => longueur >= min,
    'must be longer than or equal to $constraint1 characters',
    options,
  );

export const AuPlusCaracteres = (
  max: number,
  options?: ValidationOptions,
): PropertyDecorator =>
  borneDeLongueur(
    'maxLength',
    max,
    (longueur) => longueur <= max,
    'must be shorter than or equal to $constraint1 characters',
    options,
  );

const rogne = (valeur: unknown): unknown => {
  if (typeof valeur === 'string') return valeur.trim();
  if (Array.isArray(valeur)) return valeur.map(rogne);
  return valeur;
};

export const Rogne = (): PropertyDecorator =>
  Transform(({ value }: { value: unknown }) => rogne(value));

interface MessagesDeBornes {
  readonly min?: string;
  readonly max?: string;
}

export function TexteBorne(
  min: number,
  max: number,
  messages: MessagesDeBornes = {},
): PropertyDecorator {
  return applyDecorators(
    IsString(),
    AuMoinsCaracteres(min, { message: messages.min }),
    AuPlusCaracteres(max, { message: messages.max }),
  );
}

export function TexteSaisi(
  min: number,
  max: number,
  messages: MessagesDeBornes = {},
): PropertyDecorator {
  return applyDecorators(Rogne(), TexteBorne(min, max, messages));
}
