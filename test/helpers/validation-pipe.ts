import { type Paramtype, ValidationPipe } from '@nestjs/common';

export const GLOBAL_VALIDATION_PIPE_OPTIONS = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
};

const validationPipe = new ValidationPipe(GLOBAL_VALIDATION_PIPE_OPTIONS);

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
