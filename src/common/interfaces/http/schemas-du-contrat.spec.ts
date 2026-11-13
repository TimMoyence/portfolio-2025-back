import { ArticleContract } from '../../../modules/articles/domain/contrat/article-contract';
import { referenceAuContrat, schemasDuContrat } from './schemas-du-contrat';

describe('REF-02 · un schéma publié du contrat perd son $id et garde le reste', () => {
  const schemas = schemasDuContrat();

  it('aucun schéma du contrat ne porte $id', () => {
    expect(
      Object.entries(schemas)
        .filter(([, schema]) => Object.hasOwn(schema, '$id'))
        .map(([id]) => id),
    ).toEqual([]);
  });

  it('le schéma de l article garde ses variantes', () => {
    const id = referenceAuContrat(ArticleContract).$ref.split('/').pop() ?? '';

    expect(schemas[id]).toEqual(
      expect.objectContaining({ anyOf: expect.any(Array) }),
    );
  });
});
