export type SourceDEnv = Readonly<Record<string, unknown>>;

type LecteurDEnv = (name: string, source: SourceDEnv) => string | undefined;

export function envBrut(
  name: string,
  source: SourceDEnv = process.env,
): string | undefined {
  const brut = source[name];
  return typeof brut === 'string' && brut.trim().length > 0 ? brut : undefined;
}

export function envString(
  name: string,
  source: SourceDEnv = process.env,
): string | undefined {
  return envBrut(name, source)?.trim();
}

export function envPremier(
  noms: readonly string[],
  source: SourceDEnv = process.env,
  lire: LecteurDEnv = envString,
): string | undefined {
  for (const nom of noms) {
    const value = lire(nom, source);
    if (value !== undefined) return value;
  }
  return undefined;
}

export function envUnVrai(
  noms: readonly string[],
  source: SourceDEnv = process.env,
): boolean {
  return noms.some((nom) => envString(nom, source)?.toLowerCase() === 'true');
}

export function envInt(
  name: string,
  fallback: number,
  source: SourceDEnv = process.env,
): number {
  const parsed = Number.parseInt(envString(name, source) ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function envFloat(
  name: string,
  fallback: number,
  source: SourceDEnv = process.env,
): number {
  const parsed = Number.parseFloat(envString(name, source) ?? '');
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function envBool(
  name: string,
  fallback: boolean,
  source: SourceDEnv = process.env,
): boolean {
  const raw = (envString(name, source) ?? '').toLowerCase();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return fallback;
}
