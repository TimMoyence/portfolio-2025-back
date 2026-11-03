import type { CookieOptions } from 'express';
import { estEnProduction } from '../../../config/environnement/env-readers.util';
import { cheminDeLApi } from '../../../config/prefixe-api';

export function attributsDuCookieDeRafraichissement(): CookieOptions {
  return {
    httpOnly: true,
    secure: estEnProduction(),
    sameSite: 'strict',
    path: cheminDeLApi('auth'),
  };
}
