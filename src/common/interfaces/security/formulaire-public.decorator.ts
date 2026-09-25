import { applyDecorators, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/public.decorator';

const UNE_HEURE_MS = 3600000;
const UNE_MINUTE_MS = 60000;

export function LienPublic() {
  return applyDecorators(
    Public(),
    Throttle({ default: { limit: 10, ttl: UNE_MINUTE_MS } }),
  );
}

export function FormulairePublic(soumissionsParHeure: number, chemin?: string) {
  return applyDecorators(
    Public(),
    Throttle({ default: { limit: soumissionsParHeure, ttl: UNE_HEURE_MS } }),
    Post(chemin),
  );
}
