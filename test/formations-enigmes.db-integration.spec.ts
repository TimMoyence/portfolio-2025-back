import type { Test } from 'supertest';
import {
  buildCoursAvecEnigmes,
  ENIGMES_DE_TEST,
  PARCOURS_DE_TEST,
  TENTATIVES_MAX_DE_TEST,
} from './factories/cours.factory';
import {
  attendreJetonEtrangerRefuse,
  CODE_HTTP,
  codeDe,
  decrireSurLeDernierEcran,
  type SeanceDeTest,
} from './helpers/formations-banc-seance';

const COURS = buildCoursAvecEnigmes({ slug: 'cours-enigmes-integration' });
const SOLUTION = '23,4';
const FAUSSE = '99';
const { CREE, INTROUVABLE, CONFLIT } = CODE_HTTP;
const TENTATIVES_SIMULTANEES = 20;

interface VerdictTentative {
  correcte: boolean;
  fragment: string | null;
  tentativesRestantes: number;
}

decrireSurLeDernierEcran(
  'Enigmes du mini-jeu (B7, db integration)',
  COURS,
  (banc) => {
    const contexte = () => banc.contexte();

    const tenter = (
      seance: SeanceDeTest,
      enigmeId: string,
      reponse: string,
    ): Test =>
      banc
        .avecJeton(
          'post',
          `/sessions/${seance.sessionId}/escape/${PARCOURS_DE_TEST}/tentatives`,
          seance.jeton,
        )
        .send({ enigmeId, reponse, dureeMs: 30000 });

    const ouvrirSeance = (cle: string): Promise<SeanceDeTest> =>
      banc.ouvrirSeance({ cle });

    it('livre le fragment a la premiere reponse juste et enregistre la resolution', async () => {
      const seance = await ouvrirSeance('55555555-5555-4555-8555-000000000001');

      const reponse = await tenter(seance, ENIGMES_DE_TEST[0], SOLUTION).expect(
        CREE,
      );

      expect(reponse.body as VerdictTentative).toEqual({
        correcte: true,
        fragment: 'F0',
        tentativesRestantes: TENTATIVES_MAX_DE_TEST - 1,
      });
      const progression = await contexte().escape.listerProgression(
        seance.participantId,
        PARCOURS_DE_TEST,
      );
      expect(progression[0].resolueLe).not.toBeNull();
    });

    it('ne compte que dix tentatives quand vingt partent en parallele', async () => {
      const seance = await ouvrirSeance('55555555-5555-4555-8555-000000000002');

      const reponses = await Promise.all(
        Array.from({ length: TENTATIVES_SIMULTANEES }, (_, rang) =>
          tenter(seance, ENIGMES_DE_TEST[0], String(100 + rang)),
        ),
      );

      const progression = await contexte().escape.listerProgression(
        seance.participantId,
        PARCOURS_DE_TEST,
      );
      const epuisees = reponses.filter(
        (reponse) => codeDe(reponse) === 'TENTATIVES_EPUISEES',
      );
      expect(progression[0].tentatives).toBe(TENTATIVES_MAX_DE_TEST);
      expect(
        reponses.filter((reponse) => reponse.status === CREE),
      ).toHaveLength(TENTATIVES_MAX_DE_TEST);
      expect(epuisees).toHaveLength(
        TENTATIVES_SIMULTANEES - TENTATIVES_MAX_DE_TEST,
      );
    });

    it('refuse la onzieme tentative en 409 TENTATIVES_EPUISEES', async () => {
      const seance = await ouvrirSeance('55555555-5555-4555-8555-000000000003');
      for (let rang = 0; rang < TENTATIVES_MAX_DE_TEST; rang += 1) {
        await tenter(seance, ENIGMES_DE_TEST[0], String(200 + rang)).expect(
          CREE,
        );
      }

      const refus = await tenter(seance, ENIGMES_DE_TEST[0], FAUSSE);

      expect(refus.status).toBe(CONFLIT);
      expect(codeDe(refus)).toBe('TENTATIVES_EPUISEES');
    });

    it('ne consomme rien pour une saisie equivalente a une tentative deja faite', async () => {
      const seance = await ouvrirSeance('55555555-5555-4555-8555-000000000004');
      await tenter(seance, ENIGMES_DE_TEST[0], '26,666667').expect(CREE);

      await tenter(seance, ENIGMES_DE_TEST[0], ' 26,666667 ').expect(CREE);

      const progression = await contexte().escape.listerProgression(
        seance.participantId,
        PARCOURS_DE_TEST,
      );
      expect(progression[0].tentatives).toBe(1);
    });

    it('garde la deuxieme enigme verrouillee tant que la premiere resiste', async () => {
      const seance = await ouvrirSeance('55555555-5555-4555-8555-000000000005');

      const refus = await tenter(seance, ENIGMES_DE_TEST[1], '24,4');

      expect(refus.status).toBe(CONFLIT);
      expect(codeDe(refus)).toBe('ENIGME_VERROUILLEE');
    });

    it('ouvre la deuxieme enigme des que la premiere est resolue', async () => {
      const seance = await ouvrirSeance('55555555-5555-4555-8555-000000000006');
      await tenter(seance, ENIGMES_DE_TEST[0], SOLUTION).expect(CREE);

      const reponse = await tenter(seance, ENIGMES_DE_TEST[1], '24,4').expect(
        CREE,
      );

      expect((reponse.body as VerdictTentative).fragment).toBe('F1');
    });

    it('refuse une nouvelle tentative sur une enigme deja resolue', async () => {
      const seance = await ouvrirSeance('55555555-5555-4555-8555-000000000007');
      await tenter(seance, ENIGMES_DE_TEST[0], SOLUTION).expect(CREE);

      const refus = await tenter(seance, ENIGMES_DE_TEST[0], SOLUTION);

      expect(refus.status).toBe(CONFLIT);
      expect(codeDe(refus)).toBe('ENIGME_DEJA_RESOLUE');
    });

    it('refuse une enigme absente du parcours', async () => {
      const seance = await ouvrirSeance('55555555-5555-4555-8555-000000000008');

      const refus = await tenter(seance, 'E9-INVENTEE', SOLUTION);

      expect(refus.status).toBe(INTROUVABLE);
    });

    it('refuse le jeton d un participant d une autre seance', async () => {
      await attendreJetonEtrangerRefuse(
        banc,
        [
          '55555555-5555-4555-8555-000000000009',
          '55555555-5555-4555-8555-000000000010',
        ],
        (seance) => tenter(seance, ENIGMES_DE_TEST[0], SOLUTION),
      );
    });

    it('n enregistre qu une seule reponse pour la premiere tentative doublee', async () => {
      const seance = await ouvrirSeance('55555555-5555-4555-8555-000000000011');

      await Promise.all([
        tenter(seance, ENIGMES_DE_TEST[0], '301'),
        tenter(seance, ENIGMES_DE_TEST[0], '302'),
        tenter(seance, ENIGMES_DE_TEST[0], '303'),
      ]);

      const reponses = await contexte().answers.listBySession(seance.sessionId);
      expect(
        reponses.filter((reponse) => reponse.questionId === ENIGMES_DE_TEST[0]),
      ).toHaveLength(1);
    });

    it('efface la progression quand la seance est supprimee', async () => {
      const seance = await ouvrirSeance('55555555-5555-4555-8555-000000000012');
      await tenter(seance, ENIGMES_DE_TEST[0], SOLUTION).expect(CREE);

      await contexte().dataSource.query(
        'DELETE FROM formation_sessions WHERE id = $1',
        [seance.sessionId],
      );

      const restantes = await contexte().escape.listerProgressionDeSeance(
        seance.sessionId,
      );
      expect(restantes).toEqual([]);
    });
  },
);
