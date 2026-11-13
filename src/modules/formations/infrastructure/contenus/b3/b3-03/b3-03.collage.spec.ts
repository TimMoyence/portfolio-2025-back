import { COURS_B3_04 } from '../b3-04/b3-04.cours';
import { COURS_B3_03 } from './b3-03.cours';

const RACCOURCI_DE_MICROSOFT_365 = 'Ctrl + Maj + V';
const GESTE_DE_TOUT_WORD = 'Conserver uniquement le texte';

describe('coller le texte seul', () => {
  it.each([COURS_B3_03, COURS_B3_04])(
    'B303-01 B304-01 $slug donne le geste du menu, valable sous Word 2019, au lieu du raccourci de Microsoft 365',
    ({ ecrans }) => {
      const textes = ecrans.map((ecran) => JSON.stringify(ecran));

      expect(
        ecrans
          .filter((_, rang) =>
            textes[rang].includes(RACCOURCI_DE_MICROSOFT_365),
          )
          .map(({ screenId }) => screenId),
      ).toEqual([]);
      expect(
        textes.filter((texte) => texte.includes(GESTE_DE_TOUT_WORD)),
      ).not.toHaveLength(0);
    },
  );
});
