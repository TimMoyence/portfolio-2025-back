import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RACINE } from '../../../../../test/helpers/depot/racine';
import { TYPES_DE_FICHIER } from '../../../../common/domain/types/types-de-fichier';
import {
  CLASSEUR_RESERVE,
  FICHIER_DE_PIECE_JOINTE,
} from '../../domain/cours/stockage/ProprietesStockees';
import { classeurATelecharger } from './ClasseursSurDisque';

interface ContratOpenApi {
  readonly components: {
    readonly schemas: Readonly<
      Record<
        string,
        { readonly properties?: Record<string, { readonly pattern?: string }> }
      >
    >;
  };
}

function motifPublieDansLeContrat(): RegExp {
  const contrat = JSON.parse(
    readFileSync(join(RACINE, 'openapi.json'), 'utf8'),
  ) as ContratOpenApi;
  const motif =
    contrat.components.schemas.PieceJointePubliqueResponseDto?.properties
      ?.fichier?.pattern;
  return new RegExp(motif ?? '^$');
}

describe('pièce jointe en texte brut', () => {
  it('TXT-01 sert la note réservée en texte UTF-8, nommée sans son empreinte', () => {
    expect(
      classeurATelecharger('b3-03/B3-03_note_comite.0c1d2e3f.txt'),
    ).toEqual({
      nom: 'B3-03_note_comite.txt',
      type: 'text/plain; charset=utf-8',
    });
  });

  it('TXT-01 accepte la note publique du catalogue et refuse une extension non servie', () => {
    expect(
      FICHIER_DE_PIECE_JOINTE.test(
        '/assets/cours/b3-03/B3-03_note_comite.0c1d2e3f.txt',
      ),
    ).toBe(true);
    expect(
      FICHIER_DE_PIECE_JOINTE.test(
        '/assets/cours/b3-03/B3-03_note_comite.0c1d2e3f.exe',
      ),
    ).toBe(false);
  });

  it('TXT-02 publie dans le contrat OpenAPI le motif du fichier public, que le front lit', () => {
    const motif = motifPublieDansLeContrat();

    expect(
      motif.test('/assets/cours/b3-03/B3-03_note_comite.0c1d2e3f.txt'),
    ).toBe(true);
    expect(
      motif.test('/assets/cours/b3-01/B3-01_reprise_acte_2.0c1d2e3f.xlsm'),
    ).toBe(false);
  });

  it.each(Object.keys(TYPES_DE_FICHIER))(
    'TXT-02 dérive de TYPES_DE_FICHIER l’extension %s, servie en séance, au catalogue et dans le contrat',
    (extension) => {
      expect(CLASSEUR_RESERVE.test(`b3-03/note.0c1d2e3f.${extension}`)).toBe(
        true,
      );
      expect(
        FICHIER_DE_PIECE_JOINTE.test(
          `/assets/cours/b3-03/note.0c1d2e3f.${extension}`,
        ),
      ).toBe(true);
      expect(
        motifPublieDansLeContrat().test(
          `/assets/cours/b3-03/note.0c1d2e3f.${extension}`,
        ),
      ).toBe(true);
    },
  );
});
