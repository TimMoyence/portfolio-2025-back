import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { schemasDesModeles } from '../../../../../test/helpers/http/saisies-validees';
import { RACINE } from '../../../../../test/helpers/depot/racine';
import { ArticleContract } from '../../domain/article-contract';
import { PublishedArticleResponseDto } from './article.response.dto';

describe('MB-19 · la rubrique d une histoire du Shot va jusqu au site', () => {
  it('MB-19 · l ingestion accepte la rubrique et l API la sert', async () => {
    const recit = JSON.parse(
      readFileSync(
        join(RACINE, 'test/fixtures/articles/enveloppe-recit-du-matin.json'),
        'utf8',
      ),
    );
    expect(ArticleContract.safeParse(recit).success).toBe(true);
    const schemas = (
      await schemasDesModeles([PublishedArticleResponseDto])
    ).get(PublishedArticleResponseDto);
    expect(schemas?.HistoireDuShotDto?.properties?.rubrique?.nullable).toBe(
      true,
    );
  });
});
