import type { Response } from 'supertest';
import type { EcranPublic } from '../src/modules/formations/domain/contrats/tirage';
import { activitesLibres } from '../src/modules/formations/domain/cours/EcranServi';
import { buildCoursB2_01 } from './factories/cours-b2-01.factory';
import { describeDb } from './helpers/db-integration-datasource';
import {
  CODE_HTTP,
  installerBancDeSeance,
  type SeanceDeTest,
} from './helpers/formations-banc-seance';

const COURS = buildCoursB2_01();
const ATELIER = 'B2-01-A2-03-ATELIER-1';
const CORRECTION_DE_L_ATELIER = 'B2-01-A2-03-CORRECTION-1';
const POINTS = 'B2-01-A2-06-POINTS';
const CORRECTION_DES_POINTS = 'B2-01-A2-06-CORRECTION';
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
  'corrections du B2-01 servies à la révélation (SEC-1, SEC-2, db integration)',
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

    it('verrouille la correction en rythme libre tant que sa source n est pas révélée, puis la sert', async () => {
      const seance = await banc.ouvrirSeance({
        cle: 'c0000000-0000-4000-8000-000000000001',
      });
      await piloter(seance, {
        mode: 'libre',
        intervalle: { premier: 0, dernier: rang(CORRECTION_DE_L_ATELIER) },
      });

      const avant = ecranDuSujet(
        await lireSujet(seance),
        CORRECTION_DE_L_ATELIER,
      );
      await piloter(seance, { pilotage: { screenId: ATELIER, revele: true } });
      const apres = ecranDuSujet(
        await lireSujet(seance),
        CORRECTION_DE_L_ATELIER,
      );

      expect(avant).toMatchObject({
        type: 'ecran-verrouille',
        ecranCorrige: ATELIER,
        donnees: {},
      });
      expect(avant?.correction).toBeUndefined();
      expect(apres?.type).toBe('fp-story');
      expect(apres?.correction?.ecranId).toBe(ATELIER);
      expect(
        apres?.correction?.questions.map(({ questionId, bonneReponse }) => [
          questionId,
          questionId === 'b2-01-a2-part-marketplace' ? bonneReponse : 'vote',
        ]),
      ).toEqual([
        ['b2-01-a2-evolution-marge', 'vote'],
        ['b2-01-a2-part-marketplace', '45,5'],
        ['b2-01-a2-population-reference', 'vote'],
      ]);
    });

    it('révèle la source en pilote dès la projection de sa correction, sans la rouvrir au retour arrière', async () => {
      const seance = await banc.ouvrirSeance({
        cle: 'c0000000-0000-4000-8000-000000000002',
        ecran: rang(POINTS),
      });
      await repondreAuxPoints(seance, 'Moins 2,3 points.').expect(CREE);

      await piloter(seance, { ecran: rang(CORRECTION_DES_POINTS) });
      const projetee = ecranDuSujet(
        await lireSujet(seance),
        CORRECTION_DES_POINTS,
      );
      await piloter(seance, { ecran: rang(POINTS) });
      const refus = await repondreAuxPoints(seance, 'Après la correction.');

      expect(projetee?.type).toBe('fp-worked');
      expect(projetee?.correction?.ecranId).toBe(POINTS);
      expect([refus.status, (refus.body as { code?: string }).code]).toEqual([
        CONFLIT,
        'PHASE_FERMEE',
      ]);
    });
  },
);
