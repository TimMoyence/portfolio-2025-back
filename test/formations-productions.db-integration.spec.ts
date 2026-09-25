import type { Test } from 'supertest';
import type { ValeurProduction } from '../src/modules/formations/domain/contrats/resultats';
import { buildCoursAvecProductions } from './factories/cours.factory';
import { detailsDeFeuilleJuste } from './factories/formation.factory';
import {
  attendreEcranNonServi,
  attendreJetonEtrangerRefuse,
  attendreRefus,
  CODE_HTTP,
  decrireSurLeDernierEcran,
  type SeanceDeTest,
} from './helpers/formations-banc-seance';

const COURS = buildCoursAvecProductions({
  slug: 'cours-productions-integration',
});
const FEUILLE_JUSTE: ValeurProduction = {
  type: 'feuille',
  cellules: { D2: '=(C2-B2)/B2', D3: '=(C3-B3)/B3' },
};
const CLASSEMENT_JUSTE: ValeurProduction = {
  type: 'classement',
  classement: { 'ca-2025': 'valeur', inflation: 'ambigu' },
};
const { CREE, INVALIDE, NON_AUTORISE, CONFLIT } = CODE_HTTP;
const MAUVAISE_REQUETE = INVALIDE;
const PRODUCTIONS_SIMULTANEES = 6;

interface VerdictProduction {
  correcte: boolean;
  score: number;
  details: { cle: string; juste: boolean; libelleConfusion: string | null }[];
  libelleConfusion: string | null;
}

const FEUILLE_JUSTE_EN_UNE_SECONDE = {
  questionId: 'Q-TEST-FEUILLE',
  valeur: FEUILLE_JUSTE,
  dureeMs: 1000,
};
const CLASSEMENT_EN_UNE_SECONDE = {
  questionId: 'Q-TEST-CLASSEMENT',
  valeur: CLASSEMENT_JUSTE,
  dureeMs: 1000,
};

decrireSurLeDernierEcran(
  'Route des productions (B5, B11, db integration)',
  COURS,
  (banc) => {
    const contexte = () => banc.contexte();
    const formateur = banc.formateur;

    const chemin = (sessionId: string) => `/sessions/${sessionId}/productions`;

    const produire = (sessionId: string, jeton: string, corps: object): Test =>
      banc.avecJeton('post', chemin(sessionId), jeton).send(corps);

    const ouvrirSeance = (cle: string): Promise<SeanceDeTest> =>
      banc.ouvrirSeance({ cle });

    const seuleProductionReussie = async (seance: SeanceDeTest) => {
      const enregistrees = await contexte().answers.listBySession(
        seance.sessionId,
      );
      expect(enregistrees).toHaveLength(1);
      expect(enregistrees[0].score).toBe(1);
      return enregistrees[0];
    };

    it('corrige la feuille du participant et persiste le score et le detail', async () => {
      const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000001');

      const reponse = await produire(seance.sessionId, seance.jeton, {
        questionId: 'Q-TEST-FEUILLE',
        valeur: FEUILLE_JUSTE,
        dureeMs: 600000,
      }).expect(CREE);

      const verdict = reponse.body as VerdictProduction;
      expect(verdict.correcte).toBe(true);
      expect(verdict.score).toBe(1);
      expect(verdict.details.map((detail) => detail.cle)).toEqual(['D2', 'D3']);

      const enregistree = await seuleProductionReussie(seance);
      expect(enregistree.details).toEqual(detailsDeFeuilleJuste());
    });

    const produireLaFeuille = (seance: SeanceDeTest): Test =>
      produire(seance.sessionId, seance.jeton, FEUILLE_JUSTE_EN_UNE_SECONDE);

    it('refuse le jeton d un participant d une autre seance', async () => {
      await attendreJetonEtrangerRefuse(
        banc,
        [
          '44444444-4444-4444-8444-000000000002',
          '44444444-4444-4444-8444-000000000003',
        ],
        produireLaFeuille,
      );
    });

    it.each<[string, (seance: SeanceDeTest) => Test]>([
      [
        'une requete sans jeton de participant',
        (seance) =>
          banc
            .anonyme('post', chemin(seance.sessionId))
            .send(FEUILLE_JUSTE_EN_UNE_SECONDE),
      ],
      [
        'l identite du formateur, qui n est pas un participant',
        (seance) =>
          formateur('post', chemin(seance.sessionId)).send(
            FEUILLE_JUSTE_EN_UNE_SECONDE,
          ),
      ],
    ])('refuse %s', async (_cas, envoyer) => {
      const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000002');

      const refus = await envoyer(seance);

      expect(refus.status).toBe(NON_AUTORISE);
    });

    it.each([
      [
        'une production vide',
        { type: 'feuille', cellules: {} },
        'Q-TEST-FEUILLE',
        'PRODUCTION_VIDE',
      ],
      [
        'une cellule hors de la grille du plan',
        { type: 'feuille', cellules: { Z99: '=1' } },
        'Q-TEST-FEUILLE',
        'PRODUCTION_INVALIDE',
      ],
      [
        'une question fermee, qui passe par la route des reponses',
        FEUILLE_JUSTE,
        'Q-TEST-NUM',
        'TYPE_DE_QUESTION',
      ],
    ])('refuse %s', async (_cas, valeur, questionId, code) => {
      const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000006');

      const refus = await produire(seance.sessionId, seance.jeton, {
        questionId,
        valeur,
        dureeMs: 1000,
      });

      attendreRefus(refus, MAUVAISE_REQUETE, code);
    });

    it('refuse une production visant un ecran que le formateur n a pas projete', async () => {
      await attendreEcranNonServi(
        banc,
        '44444444-4444-4444-8444-000000000009',
        produireLaFeuille,
      );
    });

    it('refuse un second classement sur le meme tri', async () => {
      const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000010');
      await produire(
        seance.sessionId,
        seance.jeton,
        CLASSEMENT_EN_UNE_SECONDE,
      ).expect(CREE);

      const refus = await produire(
        seance.sessionId,
        seance.jeton,
        CLASSEMENT_EN_UNE_SECONDE,
      );

      attendreRefus(refus, CONFLIT, 'REPONSE_DEJA_ENREGISTREE');
    });

    it('remplace la feuille reprise avant toute correction, sans doubler l enregistrement', async () => {
      const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000012');
      await produire(seance.sessionId, seance.jeton, {
        questionId: 'Q-TEST-FEUILLE',
        valeur: { type: 'feuille', cellules: { D2: '=(C2-B2)/C2' } },
        dureeMs: 1000,
      }).expect(CREE);

      await produire(seance.sessionId, seance.jeton, {
        questionId: 'Q-TEST-FEUILLE',
        valeur: FEUILLE_JUSTE,
        dureeMs: 2000,
      }).expect(CREE);

      const enregistree = await seuleProductionReussie(seance);
      expect(enregistree.valeur).toEqual(FEUILLE_JUSTE);
    });

    it('n enregistre qu un seul classement quand le poste en envoie plusieurs en parallele', async () => {
      const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000011');

      const reponses = await Promise.all(
        Array.from({ length: PRODUCTIONS_SIMULTANEES }, () =>
          produire(seance.sessionId, seance.jeton, CLASSEMENT_EN_UNE_SECONDE),
        ),
      );

      const creees = reponses.filter((reponse) => reponse.status === CREE);
      const conflits = reponses.filter((reponse) => reponse.status === CONFLIT);
      const enregistrees = await contexte().answers.listBySession(
        seance.sessionId,
      );

      expect(creees).toHaveLength(1);
      expect(conflits).toHaveLength(PRODUCTIONS_SIMULTANEES - 1);
      expect(enregistrees).toHaveLength(1);
    });
  },
);
