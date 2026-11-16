import { CONTENUS } from '..';
import { presentationDe } from '../../../domain/cours/structure/Cours';

const REPERE_RETIRE =
  /(?:^(?:Trace écrite|L’IA analyste|L’IA rédactrice|Formules pas à pas|Traitement de texte|Publipostage) ·)|(?:· page \d+ sur \d+)/u;

const sousTitresServis = CONTENUS.flatMap((contenu) =>
  contenu.ecrans.flatMap((ecran) => {
    const props: unknown = presentationDe(ecran)?.props;
    return typeof props === 'object' &&
      props !== null &&
      'subtitle' in props &&
      typeof props.subtitle === 'string'
      ? [`${ecran.screenId} — ${props.subtitle}`]
      : [];
  }),
);

describe('sous-titres des slides', () => {
  it('ne montre ni compteur « page n sur N » ni repère de trace écrite, d’IA ou de série sur aucune slide d’aucun cours', () => {
    expect(
      sousTitresServis.filter((sousTitre) =>
        REPERE_RETIRE.test(sousTitre.split(' — ')[1] ?? ''),
      ),
    ).toEqual([]);
  });

  it('garde les autres sous-titres, comme celui de l’accroche du B3-03', () => {
    expect(sousTitresServis).toContainEqual(
      expect.stringMatching(/^B3-03-A1-02-ACCROCHE — ./u),
    );
  });
});
