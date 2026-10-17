import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

export interface CompteConnecte {
  readonly id: string;
  readonly roles: readonly string[];
}

export function compteConnecte(request: Request): CompteConnecte {
  const compte = request.user;
  if (!compte) {
    throw new UnauthorizedException();
  }
  return { id: compte.sub, roles: compte.roles };
}
