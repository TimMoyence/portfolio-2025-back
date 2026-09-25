import {
  buildAnswerRecord,
  buildMasteryRecord,
} from '../../../../../test/factories/formation.factory';
import type { AnswerRecord } from '../IAnswers.repository';
import type { MasteryRecord } from '../IMastery.repository';
import {
  choisirRappels,
  CONCEPTS_MAX,
  DELAI_MIN_RAPPEL_MS,
  ecranDeRappel,
} from './ChoixDesRappels';
import type { EcranDeRappel } from './ChoixDesRappels';

const MAINTENANT = new Date('2026-09-11T10:00:00.000Z');
const ANCIEN = new Date(MAINTENANT.getTime() - DELAI_MIN_RAPPEL_MS - 1000);
const RECENT = new Date(MAINTENANT.getTime() - 60_000);

const CIBLE: EcranDeRappel = {
  screenId: 'E-RAPPEL',
  rang: 9,
  obligatoires: ['R-COMPENSATION', 'R-MULTIPLE-NEUF'],
  banque: [
    { id: 'R-COMPENSATION', concept: 'controle-coherence' },
    { id: 'R-MULTIPLE-NEUF', concept: 'controle-coherence' },
    { id: 'R-TAUX', concept: 'taux-evolution' },
    { id: 'R-INDICE', concept: 'indice-base-100' },
    { id: 'R-PROPORTION', concept: 'proportion' },
  ],
};

function reponse(
  concept: string,
  correcte: boolean,
  soumisLe: Date,
  questionId = `Q-${concept}`,
): AnswerRecord {
  return buildAnswerRecord({ questionId, concept, correcte, soumisLe });
}

describe('ecranDeRappel', () => {
  it('rend null quand le cours n a pas d ecran de rappel espace', () => {
    expect(
      ecranDeRappel({
        slug: 'sans-rappel',
        titre: 'Sans rappel',
        niveau: 'B2',
        dureeMinutes: 10,
        concepts: ['proportion'],
        ecrans: [
          {
            id: 'E-CITATION',
            titre: null,
            diffusion: 'catalogue',
            brique: 'fp-quote',
            dureeMinutes: 2,
            concepts: ['proportion'],
            notes: 'Accroche',
            proprietes: { texte: 'x', auteur: null, source: null },
          },
        ],
        remediations: {},
        medias: [],
      }),
    ).toBeNull();
  });
});

describe('choisirRappels', () => {
  const choisir = (
    reponses: readonly AnswerRecord[],
    maitrise: readonly MasteryRecord[] = [],
  ) =>
    choisirRappels({
      cible: CIBLE,
      reponses,
      maitrise,
      maintenant: MAINTENANT,
    });

  const enBoiteTrois = (concept: string, succes: number, echecs: number) =>
    buildMasteryRecord({ concept, boite: 3, succes, echecs });

  it('sert d abord les deux rappels obligatoires', () => {
    expect(choisir([]).slice(0, 2)).toEqual([
      'R-COMPENSATION',
      'R-MULTIPLE-NEUF',
    ]);
  });

  it('rend trois ou quatre questions au total', () => {
    const servis = choisir([]);

    expect(servis.length).toBeGreaterThanOrEqual(3);
    expect(servis.length).toBeLessThanOrEqual(4);
  });

  it('ne sert jamais deux fois la meme question', () => {
    expect(new Set(choisir([])).size).toBe(choisir([]).length);
  });

  it('n ajoute jamais un concept de controle de coherence au complement', () => {
    expect(choisir([]).slice(CONCEPTS_MAX)).not.toContain('R-COMPENSATION');
  });

  it('remonte en premier le concept faux depuis au moins trente minutes', () => {
    const servis = choisir([
      reponse('proportion', false, ANCIEN),
      reponse('taux-evolution', true, ANCIEN),
    ]);

    expect(servis[2]).toBe('R-PROPORTION');
  });

  it('ignore une erreur trop recente pour la priorite la plus haute', () => {
    const servis = choisir([
      reponse('proportion', false, RECENT),
      reponse('taux-evolution', false, ANCIEN),
    ]);

    expect(servis[2]).toBe('R-TAUX');
  });

  it('departage deux erreurs anciennes par la plus ancienne', () => {
    const plusAncienne = new Date(ANCIEN.getTime() - 60_000);
    const servis = choisir([
      reponse('proportion', false, ANCIEN),
      reponse('indice-base-100', false, plusAncienne),
    ]);

    expect(servis[2]).toBe('R-INDICE');
  });

  it('retient le plus faible taux de reussite a priorite egale', () => {
    const servis = choisir(
      [],
      [
        enBoiteTrois('proportion', 1, 9),
        enBoiteTrois('taux-evolution', 9, 1),
        enBoiteTrois('indice-base-100', 8, 2),
      ],
    );

    expect(servis[2]).toBe('R-PROPORTION');
  });

  it('sert en premier un concept jamais vu, au taux de reussite nul', () => {
    const servis = choisir(
      [],
      [enBoiteTrois('proportion', 5, 5), enBoiteTrois('indice-base-100', 5, 5)],
    );

    expect(servis[2]).toBe('R-TAUX');
  });

  it('ne repropose jamais une question deja repondue', () => {
    const servis = choisir([
      reponse('controle-coherence', true, ANCIEN, 'R-COMPENSATION'),
      reponse('taux-evolution', false, ANCIEN, 'R-TAUX'),
    ]);

    expect(servis).not.toContain('R-COMPENSATION');
    expect(servis).not.toContain('R-TAUX');
  });

  it('rend la meme liste pour le meme etat, sans hasard', () => {
    const reponses = [reponse('proportion', false, ANCIEN)];

    expect(choisir(reponses)).toEqual(choisir(reponses));
  });
});
