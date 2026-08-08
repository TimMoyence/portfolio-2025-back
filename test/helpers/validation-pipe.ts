import { ValidationPipe } from '@nestjs/common';

export const GLOBAL_VALIDATION_PIPE_OPTIONS = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
};

const validationPipe = new ValidationPipe(GLOBAL_VALIDATION_PIPE_OPTIONS);

export async function validateBody<T>(
  payload: unknown,
  metatype: new () => T,
): Promise<T> {
  return (await validationPipe.transform(payload, {
    type: 'body',
    metatype,
    data: '',
  })) as T;
}

export async function validateQuery<T>(
  payload: unknown,
  metatype: new () => T,
): Promise<T> {
  return (await validationPipe.transform(payload, {
    type: 'query',
    metatype,
    data: '',
  })) as T;
}
