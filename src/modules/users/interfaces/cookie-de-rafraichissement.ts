import type { CookieOptions } from 'express';
import { cheminDeLApi } from '../../../config/prefixe-api';

export function attributsDuCookieDeRafraichissement(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: cheminDeLApi('auth'),
  };
}
