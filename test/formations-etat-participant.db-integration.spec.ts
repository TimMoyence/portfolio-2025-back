import type { Test } from 'supertest';
import type { EtatParticipant } from '../src/modules/formations/domain/contrats/pilotage';
import {
  buildCoursAvecProductions,
  buildEcranDeJalon,
  buildEcranDEnigmes,
  ENIGMES_DE_TEST,
  PARCOURS_DE_TEST,
  SONDAGE_DE_TEST,
} from './factories/cours.factory';
import {
  attendreJetonEtrangerRefuse,
  CODE_HTTP,
  decrireSurLeDernierEcran,
  type SeanceDeTest,
} from './helpers/formations-banc-seance';

const SOCLE = buildCoursAvecProductions({ slug: 'cours-moi-integration' });
const COURS = {
  ...SOCLE,
  ecrans: [
    ...SOCLE.ecrans,
    buildEcranDEnigmes(),
    buildEcranDeJalon(),
  ] as typeof SOCLE.ecrans,
};
const DERNIER_ECRAN = COURS.ecrans.length - 1;

decrireSurLeDernierEcran(
  'Etat du participant (B23, db integration)',
  COURS,
  (banc) => {
    const monEtat = (seance: SeanceDeTest, jeton = seance.jeton): Test =>
      banc.avecJeton('get', `/sessions/${seance.sessionId}/moi`, jeton);

    it('rend un etat vide au participant qui vient de rejoindre', async () => {
      const seance = await banc.ouvrirSeance({
        cle: '88888888-8888-4888-8888-000000000001',
      });

      const reponse = await monEtat(seance).expect(CODE_HTTP.OK);

      expect(reponse.body as EtatParticipant).toEqual({
        sessionId: seance.sessionId,
        participantId: seance.participantId,
        revision: expect.any(Number),
        reponses: [],
        reponsesLibres: [],
        jalons: [],
        enigmes: [],
        defis: [],
        rappels: { questionIds: [] },
      });
    });

    it('restitue la production corrigee, le jalon et l enigme resolue', async () => {
      const seance = await banc.ouvrirSeance({
        cle: '88888888-8888-4888-8888-000000000002',
      });
      await banc
        .avecJeton(
          'post',
          `/sessions/${seance.sessionId}/productions`,
          seance.jeton,
        )
        .send({
          questionId: 'Q-TEST-FEUILLE',
          valeur: {
            type: 'feuille',
            cellules: { D2: '=(C2-B2)/B2', D3: '=(C3-B3)/B3' },
          },
          dureeMs: 1000,
        })
        .expect(CODE_HTTP.CREE);
      await banc
        .avecJeton(
          'put',
          `/sessions/${seance.sessionId}/pulses/${SONDAGE_DE_TEST}`,
          seance.jeton,
        )
        .send({ etat: 'clair' })
        .expect(CODE_HTTP.SANS_CONTENU);
      await banc
        .avecJeton(
          'post',
          `/sessions/${seance.sessionId}/escape/${PARCOURS_DE_TEST}/tentatives`,
          seance.jeton,
        )
        .send({ enigmeId: ENIGMES_DE_TEST[0], reponse: '23,4', dureeMs: 1000 })
        .expect(CODE_HTTP.CREE);

      const etat = (await monEtat(seance).expect(CODE_HTTP.OK))
        .body as EtatParticipant;

      expect(etat.reponses.map((reponse) => reponse.questionId)).toContain(
        'Q-TEST-FEUILLE',
      );
      expect(etat.jalons).toEqual([
        { sondageId: SONDAGE_DE_TEST, etat: 'clair' },
      ]);
      expect(etat.enigmes[0].resolues).toEqual([
        { enigmeId: ENIGMES_DE_TEST[0], fragment: 'F0' },
      ]);
    });

    it('ne laisse jamais voir l etat d un autre participant', async () => {
      const premier = await banc.ouvrirSeance({
        cle: '88888888-8888-4888-8888-000000000003',
      });
      const second = await banc.inscrire(
        premier,
        '88888888-8888-4888-8888-000000000004',
        'Lea',
      );
      await banc
        .avecJeton(
          'put',
          `/sessions/${premier.sessionId}/pulses/${SONDAGE_DE_TEST}`,
          premier.jeton,
        )
        .send({ etat: 'perdu' })
        .expect(CODE_HTTP.SANS_CONTENU);

      const etat = (await monEtat(second).expect(CODE_HTTP.OK))
        .body as EtatParticipant;

      expect(etat.participantId).toBe(second.participantId);
      expect(etat.jalons).toEqual([]);
    });

    it('refuse le jeton d un participant d une autre seance', async () => {
      await attendreJetonEtrangerRefuse(
        banc,
        [
          '88888888-8888-4888-8888-000000000005',
          '88888888-8888-4888-8888-000000000006',
        ],
        (seance) => monEtat(seance),
      );
    });

    it('refuse une requete sans jeton de participant', async () => {
      const seance = await banc.ouvrirSeance({
        cle: '88888888-8888-4888-8888-000000000007',
      });

      const refus = await banc.anonyme(
        'get',
        `/sessions/${seance.sessionId}/moi`,
      );

      expect(refus.status).toBe(CODE_HTTP.NON_AUTORISE);
    });

    it('suit la revision de la seance apres un pilotage', async () => {
      const seance = await banc.ouvrirSeance({
        cle: '88888888-8888-4888-8888-000000000008',
      });
      const avant = (await monEtat(seance).expect(CODE_HTTP.OK))
        .body as EtatParticipant;

      await banc
        .formateur('patch', `/sessions/${seance.sessionId}/control`)
        .send({ ecran: DERNIER_ECRAN - 1 })
        .expect(CODE_HTTP.SANS_CONTENU);
      const apres = (await monEtat(seance).expect(CODE_HTTP.OK))
        .body as EtatParticipant;

      expect(apres.revision).toBeGreaterThan(avant.revision);
    });
  },
);
