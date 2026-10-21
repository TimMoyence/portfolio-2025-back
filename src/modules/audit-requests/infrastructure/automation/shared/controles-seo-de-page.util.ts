import type { UrlIndexabilityResult } from '../url-indexability.service';

export function texteDeBalise(valeur: string | null | undefined): string {
  return (valeur ?? '').trim();
}

export function baliseAbsente(valeur: string | null | undefined): boolean {
  return texteDeBalise(valeur).length === 0;
}

export function h1NonConforme(
  page: Pick<UrlIndexabilityResult, 'h1Count'>,
): boolean {
  return (page.h1Count ?? 1) !== 1;
}

export function canonicalNonConforme(
  page: Pick<UrlIndexabilityResult, 'canonical' | 'canonicalCount'>,
): boolean {
  return !page.canonical || (page.canonicalCount ?? 0) !== 1;
}
