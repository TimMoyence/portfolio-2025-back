import type { Response } from 'supertest';
import type { EcranPublic } from '../src/modules/formations/domain/contrats/tirage';
import { activitesLibres } from '../src/modules/formations/domain/cours/EcranServi';
import { buildCoursB2_01 } from './factories/cours-b2-01.factory';
import { describeDb } from './helpers/db-integration-datasource';
import {
  attendreRefus,
  CODE_HTTP,
  installerBancDeSeance,
  type SeanceDeTest,
} from './helpers/formations-banc-seance';

const COURS = buildCoursB2_01();
const ATELIER = 'B2-01-A2-03-ATELIER-1';
const POINTS = 'B2-01-A2-06-POINTS';
const DIAGNOSTIC = 'B2-01-A1-01-DIAGNOSTIC';
const FEUILLE = 'B2-01-A4-02-FEUILLE-CANAUX';
const COFFRE = 'B2-01-A6-02-COFFRE';
const PARCOURS_DU_COFFRE = 'b2-01-a6-coffre';
const PREMIERE_ENIGME = 'b2-01-a6-e1-mix';
const { OK, CREE, SANS_CONTENU, CONFLIT } = CODE_HTTP;

function rang(id: string): number {
  return COURS.ecrans.findIndex((ecran) => ecran.id === id);
}

function ecranDuSujet(reponse: Response, id: string): EcranPublic | undefined {
  return (reponse.body as { ecrans: EcranPublic[] }).ecrans.find(
    (ecran) => ecran.id === id,
  );
}

describeDb(
  'corrections du B2-01 servies sur place à la révélation (SEC-1, SEC-2, db integration)',
  () => {
    const banc = installerBancDeSeance({ slug: COURS.slug });

    const piloter = (seance: SeanceDeTest, corps: object) =>
      banc
        .formateur('patch', `/sessions/${seance.sessionId}/control`)
        .send(corps)
        .expect(SANS_CONTENU);

    const lireSujet = (seance: SeanceDeTest) =>
      banc
        .avecJeton('get', `/sessions/${seance.sessionId}/sujet`, seance.jeton)
        .expect(OK);

    const lireEcran = async (seance: SeanceDeTest, id: string) =>
      ecranDuSujet(await lireSujet(seance), id);

    const repondreAuxPoints = (seance: SeanceDeTest, texte: string) =>
      banc
        .avecJeton(
          'post',
          `/sessions/${seance.sessionId}/free-responses`,
          seance.jeton,
        )
        .send({
          screenId: POINTS,
          activityId: activitesLibres(COURS).get(POINTS)?.[0],
          response: texte,
          dureeMs: 30000,
        });

    it('sert sur l atelier lui-même ses explications révélées une à une, et rien avant', async () => {
      const seance = await banc.ouvrirSeance({
        cle: 'c0000000-0000-4000-8000-000000000001',
        ecran: rang(ATELIER),
      });

      const avant = await lireEcran(seance, ATELIER);
      await piloter(seance, {
        pilotage: { screenId: ATELIER, explicationsDevoilees: 1 },
      });
      const premiere = await lireEcran(seance, ATELIER);
      await piloter(seance, {
        pilotage: { screenId: ATELIER, explicationsDevoilees: 3 },
      });
      const complete = await lireEcran(seance, ATELIER);

      expect(avant?.correction).toBeUndefined();
      expect(premiere?.type).toBe('questionnaire');
      expect(
        premiere?.correction?.explications?.map(({ reference }) => reference),
      ).toEqual(['b2-01-a2-evolution-marge']);
      expect(
        complete?.correction?.questions.map(({ questionId, bonneReponse }) => [
          questionId,
          questionId === 'b2-01-a2-part-marketplace' ? bonneReponse : 'vote',
        ]),
      ).toEqual([
        ['b2-01-a2-evolution-marge', 'vote'],
        ['b2-01-a2-part-marketplace', '45,5'],
        ['b2-01-a2-population-reference', 'vote'],
      ]);
      expect(complete?.correction?.explications).toHaveLength(3);
    });

    it('ferme l étape des points dès que sa correction se dévoile, sans la rouvrir au retour arrière', async () => {
      const seance = await banc.ouvrirSeance({
        cle: 'c0000000-0000-4000-8000-000000000002',
        ecran: rang(POINTS),
      });
      await repondreAuxPoints(seance, 'Moins 2,3 points.').expect(CREE);

      await piloter(seance, { pilotage: { screenId: POINTS, etayage: 1 } });
      await piloter(seance, { pilotage: { screenId: POINTS, etayage: 0 } });
      const refus = await repondreAuxPoints(seance, 'Après la correction.');

      attendreRefus(refus, CONFLIT, 'PHASE_FERMEE');
    });

    it('SEC-4 · ferme le coffre aux tentatives dès que sa correction se dévoile sur place', async () => {
      const seance = await banc.ouvrirSeance({
        cle: 'c0000000-0000-4000-8000-000000000004',
        ecran: rang(COFFRE),
      });

      await piloter(seance, {
        pilotage: { screenId: COFFRE, explicationsDevoilees: 1 },
      });
      const corrige = await lireEcran(seance, COFFRE);
      const refus = await banc
        .avecJeton(
          'post',
          `/sessions/${seance.sessionId}/escape/${PARCOURS_DU_COFFRE}/tentatives`,
          seance.jeton,
        )
        .send({ enigmeId: PREMIERE_ENIGME, reponse: '12', dureeMs: 30000 });

      expect(corrige?.correction?.ecranId).toBe(COFFRE);
      expect(corrige?.correction?.explications?.[0]?.reference).toBe(
        PREMIERE_ENIGME,
      );
      attendreRefus(refus, CONFLIT, 'PHASE_FERMEE');
    });

    it('T9 · sert sur le diagnostic et la feuille révélés leur propre corrigé, et rien avant', async () => {
      const seance = await banc.ouvrirSeance({
        cle: 'c0000000-0000-4000-8000-000000000003',
        ecran: rang(FEUILLE),
      });

      const avant = await lireSujet(seance);
      await piloter(seance, {
        pilotage: { screenId: DIAGNOSTIC, revele: true },
      });
      await piloter(seance, { pilotage: { screenId: FEUILLE, revele: true } });
      const apres = await lireSujet(seance);

      expect(ecranDuSujet(avant, DIAGNOSTIC)?.correction).toBeUndefined();
      expect(ecranDuSujet(avant, FEUILLE)?.correction).toBeUndefined();
      expect(ecranDuSujet(apres, DIAGNOSTIC)?.correction).toMatchObject({
        ecranId: DIAGNOSTIC,
        questions: [{ questionId: expect.any(String) as string }],
      });
      expect(ecranDuSujet(apres, FEUILLE)?.correction).toMatchObject({
        ecranId: FEUILLE,
        corrige: { type: 'feuille' },
      });
    });
  },
);
