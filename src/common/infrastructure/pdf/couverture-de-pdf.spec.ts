import { join } from 'path';
import {
  sourcesHorsProprietaire,
  sourcesQuiEcrivent,
} from '../../../../test/helpers/source-tree';

const SOURCES = join(__dirname, '../../..');

describe('couvertureDePdf', () => {
  it('est la seule à écrire le squelette d une couverture de PDF', () => {
    const sources = sourcesHorsProprietaire(
      SOURCES,
      join(__dirname, 'couverture-de-pdf.ts'),
    );

    expect(sources).toContain(join(SOURCES, 'main.ts'));
    expect(
      sourcesQuiEcrivent(
        SOURCES,
        sources,
        /class="(?:page cover|cover-gradient|cover-footer)"/,
      ),
    ).toEqual([]);
  });
});
