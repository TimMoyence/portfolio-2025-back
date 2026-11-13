import { CONTENUS } from '..';
import { presentationDe } from '../../../domain/cours/structure/Cours';

function champDeLAccroche(
  contenu: (typeof CONTENUS)[number],
  champ: 'bgImage' | 'bgImageAlt',
): unknown {
  return contenu.ecrans.flatMap((ecran) => {
    const presentation = presentationDe(ecran);
    const props = presentation?.renderer === 'hero' ? presentation.props : null;
    return typeof props === 'object' && props !== null && champ in props
      ? [Object.entries(props).find(([cle]) => cle === champ)?.[1]]
      : [];
  })[0];
}

describe.each(CONTENUS.map((contenu) => [contenu.slug, contenu] as const))(
  'M1 — accroche de %s',
  (_slug, contenu) => {
    it('pose en fond une gravure du domaine public, décrite et cataloguée avec sa page Commons', () => {
      const bgImage = champDeLAccroche(contenu, 'bgImage');
      const bgImageAlt = champDeLAccroche(contenu, 'bgImageAlt');

      expect(bgImage).toEqual(
        expect.stringMatching(
          /^\/assets\/cours\/[a-z0-9-]+\/v\d+\/[a-z0-9-]+\.(jpg|webp)$/,
        ),
      );
      expect(bgImageAlt).toEqual(expect.stringMatching(/^.{20,}$/));
      expect(
        (contenu.medias ?? []).find((media) =>
          JSON.stringify(media).includes(`"${String(bgImage)}"`),
        ),
      ).toMatchObject({
        licence: 'domaine public',
        pageSource: expect.stringMatching(
          /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/,
        ),
      });
    });
  },
);
