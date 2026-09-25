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
