import { ArticleContract } from '../../../modules/articles/domain/contrat/article-contract';
import { referenceAuContrat, schemasDuContrat } from './schemas-du-contrat';

type Noeud = { [cle: string]: unknown };

function enumsNullables(noeud: unknown, chemin: string): [string, unknown[]][] {
  if (noeud === null || typeof noeud !== 'object') return [];
  const objet = noeud as Noeud;
  const ici: [string, unknown[]][] =
    objet.nullable === true && Array.isArray(objet.enum)
      ? [[chemin, objet.enum]]
      : [];
  return [
    ...ici,
    ...Object.entries(objet).flatMap(([cle, valeur]) =>
      enumsNullables(valeur, `${chemin}/${cle}`),
    ),
  ];
}

describe('MB-09 · un enum nullable du contrat publié admet null, comme le zod qui le produit', () => {
  it('l enveloppe d ingestion admet une citation française (traduite_de null)', () => {
    const id = referenceAuContrat(ArticleContract).$ref.split('/').pop() ?? '';
    const trouves = enumsNullables(schemasDuContrat()[id], id);
    expect(trouves.length).toBeGreaterThan(0);
    expect(trouves.filter(([, valeurs]) => !valeurs.includes(null))).toEqual(
      [],
    );
  });

  it('aucun enum nullable du contrat n oublie null', () => {
    const sansNull = enumsNullables(schemasDuContrat(), '#').filter(
      ([, valeurs]) => !valeurs.includes(null),
    );
    expect(sansNull).toEqual([]);
  });
});
