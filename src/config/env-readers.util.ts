import {
  estEntierDansLesBornes,
  type Bornes,
} from '../common/domain/nombres/dans-les-bornes';
import type { VariableDEnv } from './env.validation';

export type SourceDEnv = Readonly<Record<string, unknown>>;

type LecteurDEnv = (
  name: VariableDEnv,
  source: SourceDEnv,
) => string | undefined;

export function envBrut(
  name: VariableDEnv,
  source: SourceDEnv = process.env,
): string | undefined {
  const brut = source[name];
  return typeof brut === 'string' && brut.trim().length > 0 ? brut : undefined;
}

export function envString(
  name: VariableDEnv,
  source: SourceDEnv = process.env,
): string | undefined {
  return envBrut(name, source)?.trim();
}

export function estEnProduction(source: SourceDEnv = process.env): boolean {
  return envString('NODE_ENV', source) === 'production';
}

export function envListe(
  name: VariableDEnv,
  source: SourceDEnv = process.env,
): string[] {
  return (envString(name, source) ?? '')
    .split(',')
    .map((entree) => entree.trim())
    .filter((entree) => entree.length > 0);
}

export function envPremier(
  noms: readonly VariableDEnv[],
  source: SourceDEnv = process.env,
  lire: LecteurDEnv = envString,
): string | undefined {
  for (const nom of noms) {
    const value = lire(nom, source);
    if (value !== undefined) return value;
  }
  return undefined;
}

const ENTIER_POSITIF = /^\d+$/;

export function envPort(
  noms: readonly VariableDEnv[],
  service: string,
  source: SourceDEnv = process.env,
): number | undefined {
  const brut = envPremier(noms, source);
  if (brut === undefined) return undefined;
  if (!ENTIER_POSITIF.test(brut)) {
    throw new Error(
      `Le port ${service} « ${brut} » n'est pas un entier positif (${noms.join(', ')}).`,
    );
  }
  return Number(brut);
}

export function envUnVrai(
  noms: readonly VariableDEnv[],
  source: SourceDEnv = process.env,
): boolean {
  return noms.some((nom) => envString(nom, source)?.toLowerCase() === 'true');
}

export function envInt(
  name: VariableDEnv,
  fallback: number,
  source: SourceDEnv = process.env,
): number {
  const parsed = Number.parseInt(envString(name, source) ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export interface BornesEntieres extends Bornes {
  readonly defaut: number;
}

export function envEntierBorne(
  name: VariableDEnv,
  bornes: BornesEntieres,
  source: SourceDEnv = process.env,
): number {
  const valeur = Number(envString(name, source));
  return estEntierDansLesBornes(valeur, bornes) ? valeur : bornes.defaut;
}

export function envFloat(
  name: VariableDEnv,
  fallback: number,
  source: SourceDEnv = process.env,
): number {
  const parsed = Number.parseFloat(envString(name, source) ?? '');
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function envBool(
  name: VariableDEnv,
  fallback: boolean,
  source: SourceDEnv = process.env,
): boolean {
  const raw = (envString(name, source) ?? '').toLowerCase();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return fallback;
}
