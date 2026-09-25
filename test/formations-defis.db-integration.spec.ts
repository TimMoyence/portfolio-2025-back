import type { Test } from 'supertest';
import {
  buildCoursAvecDefi,
  DEFI_DE_TEST,
  STRATEGIES_REVELEES_DU_DEFI,
} from './factories/cours.factory';
import {
  attendreJetonEtrangerRefuse,
  CODE_HTTP,
  decrireSurLeDernierEcran,
  type SeanceDeTest,
} from './helpers/formations-banc-seance';

const COURS = buildCoursAvecDefi({ slug: 'cours-defis-integration' });
const ECRAN_DU_DEFI = 'E-DEFI';
const { CREE, OK, SANS_CONTENU, INVALIDE, INTROUVABLE } = CODE_HTTP;
const MAUVAISE_REQUETE = INVALIDE;
const TENTATIVES_SIMULTANEES = 5;

interface Strategies {
  strategies: { id: string; libelle: string; fausse?: boolean }[];
}

decrireSurLeDernierEcran(
  'Defis ouverts (B12, db integration)',
  COURS,
  (banc) => {
    const lignesDe = (seance: SeanceDeTest) =>
      banc
        .contexte()
        .freeResponses.listerDuParticipant(
          seance.sessionId,
          seance.participantId,
        );

    const tenter = (seance: SeanceDeTest, texte: string): Test =>
      banc
        .avecJeton(
          'post',
          `/sessions/${seance.sessionId}/defis/${DEFI_DE_TEST}/tentative`,
          seance.jeton,
        )
        .send({ texte, dureeMs: 120000 });

    const relire = (seance: SeanceDeTest): Test =>
      banc.avecJeton(
        'get',
        `/sessions/${seance.sessionId}/defis/${DEFI_DE_TEST}/strategies`,
        seance.jeton,
      );

    const inscrire = (
      seance: SeanceDeTest,
      cle: string,
    ): Promise<SeanceDeTest> => banc.inscrire(seance, cle, 'Lea');

    const ouvrirSeance = (cle: string): Promise<SeanceDeTest> =>
      banc.ouvrirSeance({ cle });

    it('ne sert les strategies qu apres l envoi, sans leur justesse', async () => {
      const seance = await ouvrirSeance('77777777-7777-4777-8777-000000000001');

      const avant = await relire(seance);
      const apres = await tenter(seance, 'Je lis l’origine de l’axe.');

      expect(avant.status).toBe(INTROUVABLE);
      expect(apres.status).toBe(CREE);
      const strategies = (apres.body as Strategies).strategies;
      expect(strategies).toHaveLength(2);
      expect(strategies.some((item) => 'fausse' in item)).toBe(false);
    });

    it('ajoute la justesse seulement apres la revelation pilotee', async () => {
      const seance = await ouvrirSeance('77777777-7777-4777-8777-000000000002');
      await tenter(seance, 'Je lis l’origine de l’axe.').expect(CREE);

      await banc
        .piloter(seance.sessionId, {
          pilotage: { screenId: ECRAN_DU_DEFI, revele: true },
        })
        .expect(SANS_CONTENU);
      const apres = await relire(seance).expect(OK);

      expect((apres.body as Strategies).strategies).toEqual(
        STRATEGIES_REVELEES_DU_DEFI,
      );
    });

    it('fige la premiere tentative meme apres une seconde', async () => {
      const seance = await ouvrirSeance('77777777-7777-4777-8777-000000000003');
      await tenter(seance, 'Première idée.').expect(CREE);

      await tenter(seance, 'Seconde idée.').expect(CREE);

      const lignes = await lignesDe(seance);
      expect(lignes[0].premiereReponse).toBe('Première idée.');
      expect(lignes[0].response).toBe('Seconde idée.');
    });

    it('garde une seule premiere tentative malgre des envois simultanes', async () => {
      const seance = await ouvrirSeance('77777777-7777-4777-8777-000000000004');

      await Promise.all(
        Array.from({ length: TENTATIVES_SIMULTANEES }, (_, rang) =>
          tenter(seance, `Idée ${rang}.`),
        ),
      );

      const lignes = await lignesDe(seance);
      expect(lignes).toHaveLength(1);
      expect(lignes[0].premiereReponse).toMatch(/^Idée \d\.$/);
    });

    it('ne sert jamais les strategies au participant qui n a pas tente', async () => {
      const premier = await ouvrirSeance(
        '77777777-7777-4777-8777-000000000005',
      );
      const second = await inscrire(
        premier,
        '77777777-7777-4777-8777-000000000006',
      );
      await tenter(premier, 'Je lis l’origine.').expect(CREE);

      const refus = await relire(second);

      expect(refus.status).toBe(INTROUVABLE);
    });

    it('refuse une tentative vide', async () => {
      const seance = await ouvrirSeance('77777777-7777-4777-8777-000000000007');

      const refus = await tenter(seance, '   ');

      expect(refus.status).toBe(MAUVAISE_REQUETE);
    });

    it('refuse le jeton d un participant d une autre seance', async () => {
      await attendreJetonEtrangerRefuse(
        banc,
        [
          '77777777-7777-4777-8777-000000000008',
          '77777777-7777-4777-8777-000000000009',
        ],
        (seance) => tenter(seance, 'Je lis l’origine.'),
      );
    });

    it('refuse un defi absent du cours', async () => {
      const seance = await ouvrirSeance('77777777-7777-4777-8777-000000000010');

      const refus = await banc
        .avecJeton(
          'post',
          `/sessions/${seance.sessionId}/defis/defi-invente/tentative`,
          seance.jeton,
        )
        .send({ texte: 'Une idée.', dureeMs: 1000 });

      expect(refus.status).toBe(INTROUVABLE);
    });
  },
);
