import { getMetadataArgsStorage } from 'typeorm';
import { ArticleEntity } from './article.entity';
import { ReferenceArticle } from './reference-article';

class LigneTemoin {
  @ReferenceArticle('FK_temoin_article', 'CASCADE')
  articleRecordId: string;
}

describe('ReferenceArticle', () => {
  const storage = getMetadataArgsStorage();

  it('declare une colonne uuid', () => {
    const colonne = storage.columns.find(
      (args) =>
        args.target === LigneTemoin && args.propertyName === 'articleRecordId',
    );

    expect(colonne?.options.type).toBe('uuid');
  });

  it('la relie a l article par une cle etrangere nommee', () => {
    const cle = storage.foreignKeys.find((args) => args.target === LigneTemoin);
    const cible = cle?.type as () => unknown;

    expect(cle?.propertyName).toBe('articleRecordId');
    expect(cible()).toBe(ArticleEntity);
    expect(cle?.name).toBe('FK_temoin_article');
    expect(cle?.onDelete).toBe('CASCADE');
  });
});
