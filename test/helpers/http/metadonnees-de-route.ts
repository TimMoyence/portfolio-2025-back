import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { MetadataScanner } from '@nestjs/core';

export function methodeDe<T extends object>(
  classe: { prototype: T },
  nom: keyof T & string,
): object {
  return Object.getOwnPropertyDescriptor(classe.prototype, nom)
    ?.value as object;
}

export function limiteDeThrottle(handler: object): {
  limite: unknown;
  fenetre: unknown;
  suivi: unknown;
} {
  return {
    limite: Reflect.getMetadata('THROTTLER:LIMITdefault', handler) as unknown,
    fenetre: Reflect.getMetadata('THROTTLER:TTLdefault', handler) as unknown,
    suivi: Reflect.getMetadata('THROTTLER:TRACKERdefault', handler) as unknown,
  };
}

type MethodeHttp = 'get' | 'post' | 'put' | 'patch' | 'delete';

const METHODES_HTTP: Partial<Record<RequestMethod, MethodeHttp>> = {
  [RequestMethod.GET]: 'get',
  [RequestMethod.POST]: 'post',
  [RequestMethod.PUT]: 'put',
  [RequestMethod.PATCH]: 'patch',
  [RequestMethod.DELETE]: 'delete',
};

export interface RouteDeclaree {
  readonly action: string;
  readonly methode: MethodeHttp;
  readonly chemin: string;
  readonly gestionnaire: object;
}

function methodeHttpDe(gestionnaire: object, action: string): MethodeHttp {
  const declaree = Reflect.getMetadata(
    METHOD_METADATA,
    gestionnaire,
  ) as RequestMethod;
  const methode = METHODES_HTTP[declaree];
  if (methode === undefined) {
    throw new Error(
      `Méthode HTTP ${RequestMethod[declaree]} de ${action} non prise en charge`,
    );
  }
  return methode;
}

export function routesDuControleur(controleur: {
  readonly prototype: object;
}): RouteDeclaree[] {
  const prototype = controleur.prototype as Readonly<Record<string, unknown>>;
  return new MetadataScanner()
    .getAllMethodNames(prototype)
    .flatMap((action) => {
      const gestionnaire = prototype[action] as object;
      const chemin = Reflect.getMetadata(PATH_METADATA, gestionnaire) as
        | string
        | undefined;
      return chemin === undefined
        ? []
        : [
            {
              action,
              methode: methodeHttpDe(gestionnaire, action),
              chemin,
              gestionnaire,
            },
          ];
    });
}
