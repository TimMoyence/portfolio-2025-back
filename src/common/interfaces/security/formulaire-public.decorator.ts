import { applyDecorators, Post, UseInterceptors } from '@nestjs/common';
import { ApiTooManyRequestsResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/public.decorator';
import { IntercepteurAntiRobot } from './intercepteur-anti-robot';

const UNE_HEURE_MS = 3600000;
const UNE_MINUTE_MS = 60000;

export function RoutePublique() {
  return applyDecorators(
    Public(),
    ApiTooManyRequestsResponse({ description: 'Trop de requetes' }),
  );
}

export function LienPublic() {
  return applyDecorators(
    RoutePublique(),
    Throttle({ default: { limit: 10, ttl: UNE_MINUTE_MS } }),
  );
}

export function ProtegeContreLesRobots() {
  return UseInterceptors(IntercepteurAntiRobot);
}

export function FormulairePublic(soumissionsParHeure: number, chemin?: string) {
  return applyDecorators(
    RoutePublique(),
    Throttle({ default: { limit: soumissionsParHeure, ttl: UNE_HEURE_MS } }),
    Post(chemin),
    ProtegeContreLesRobots(),
  );
}
