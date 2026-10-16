import { type Paramtype, ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { type ValidationError, validateSync } from 'class-validator';
import { OPTIONS_DE_VALIDATION_GLOBALE } from '../../src/common/interfaces/http/traitements-globaux';

const validationPipe = new ValidationPipe(OPTIONS_DE_VALIDATION_GLOBALE);

function validerEn(type: Paramtype) {
  return async <T>(payload: unknown, metatype: new () => T): Promise<T> =>
    (await validationPipe.transform(payload, {
      type,
      metatype,
      data: '',
    })) as T;
}

export const validateBody = validerEn('body');
export const validateQuery = validerEn('query');
export const validateParams = validerEn('param');

const erreursDeSaisie = (
  dto: new () => object,
  corps: object,
): ValidationError[] => validateSync(plainToInstance(dto, corps));

export const champsRefuses = (dto: new () => object, corps: object): string[] =>
  erreursDeSaisie(dto, corps).map((erreur) => erreur.property);

export const saisieRetenue = <T extends object>(
  dto: new () => T,
  corps: object,
): T | null => {
  const saisie = plainToInstance(dto, corps);
  return validateSync(saisie).length === 0 ? saisie : null;
};

export const messagesDeRefus = (
  dto: new () => object,
  corps: object,
): string[] =>
  erreursDeSaisie(dto, corps).flatMap((erreur) =>
    Object.values(erreur.constraints ?? {}),
  );
