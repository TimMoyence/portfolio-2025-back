import { CONTENUS } from '..';

const MENTIONS_INTERDITES = [
  /CCF/iu,
  /devoir maison/iu,
  /★/u,
  /"kind":"exam"/u,
] as const;

const COURS_B2 = CONTENUS.filter((contenu) => contenu.slug.startsWith('b2-'));

describe('Les cours B2, sans CCF ni devoir maison', () => {
  it('lit les neuf cours B2', () => {
    expect(COURS_B2).toHaveLength(9);
  });

  it.each(COURS_B2.map((contenu) => [contenu.slug, contenu] as const))(
    'RET-07 · %s ne nomme ni le CCF, ni le devoir maison, ni un exercice ★',
    (_slug, contenu) => {
      expect(
        contenu.ecrans.flatMap((ecran) => {
          const texte = JSON.stringify(ecran);
          return MENTIONS_INTERDITES.filter((motif) => motif.test(texte)).map(
            (motif) => `${ecran.screenId} : ${motif.source}`,
          );
        }),
      ).toEqual([]);
    },
  );
});
