import { z } from 'zod';

type DatesDeLArticle = {
  sections: readonly unknown[];
  sources: readonly unknown[];
};

const DATE_SERVIE = z.iso.datetime();

function dateCanonique(recue: unknown): string | null {
  if (typeof recue !== 'string') return null;
  const instant = Date.parse(recue);
  if (Number.isNaN(instant)) return null;
  const servie = new Date(instant).toISOString();
  return DATE_SERVIE.safeParse(servie).success ? servie : null;
}

function datesDe(valeur: unknown): unknown {
  if (Array.isArray(valeur)) return valeur.map(datesDe);
  if (valeur === null || typeof valeur !== 'object') return valeur;
  return Object.fromEntries(
    Object.entries(valeur).map(([cle, contenu]) => [
      cle,
      cle === 'publie_le' ? dateCanonique(contenu) : datesDe(contenu),
    ]),
  );
}

export function avecDatesCanoniques<T extends DatesDeLArticle>(article: T): T {
  return {
    ...article,
    sections: datesDe(article.sections) as T['sections'],
    sources: datesDe(article.sources) as T['sources'],
  };
}
