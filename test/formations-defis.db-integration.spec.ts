import type { Test } from 'supertest';
import {
  buildCoursAvecDefi,
  creerCatalogueDeTest,
  DEFI_DE_TEST,
} from './factories/cours.factory';
import { describeDb } from './helpers/db-integration-datasource';
import {
  CODE_HTTP,
  installerBancDeSeance,
  type SeanceDeTest,
} from './helpers/formations-banc-seance';

const COURS = buildCoursAvecDefi({ slug: 'cours-defis-integration' });
const CATALOGUE = creerCatalogueDeTest(COURS);
const DERNIER_ECRAN = COURS.ecrans.length - 1;
const ECRAN_DU_DEFI = 'E-DEFI';
const { CREE, OK, SANS_CONTENU, INVALIDE, NON_AUTORISE, INTROUVABLE } =
  CODE_HTTP;
const MAUVAISE_REQUETE = INVALIDE;
const TENTATIVES_SIMULTANEES = 5;

interface Strategies {
  strategies: { id: string; libelle: string; fausse?: boolean }[];
}

describeDb('Defis ouverts (B12, db integration)', () => {
  const banc = installerBancDeSeance({
    catalogue: CATALOGUE,
    slug: COURS.slug,
    ecran: DERNIER_ECRAN,
  });
  const contexte = () => banc.contexte();
  const formateur = banc.formateur;

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

  const inscrire = (seance: SeanceDeTest, cle: string): Promise<SeanceDeTest> =>
    banc.inscrire(seance, cle, 'Lea');

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

    await formateur('patch', `/sessions/${seance.sessionId}/control`)
      .send({ pilotage: { screenId: ECRAN_DU_DEFI, revele: true } })
      .expect(SANS_CONTENU);
    const apres = await relire(seance).expect(OK);

    expect((apres.body as Strategies).strategies).toEqual([
      { id: 'axe', libelle: expect.any(String), fausse: false },
      { id: 'couleur', libelle: expect.any(String), fausse: true },
    ]);
  });

  it('fige la premiere tentative meme apres une seconde', async () => {
    const seance = await ouvrirSeance('77777777-7777-4777-8777-000000000003');
    await tenter(seance, 'Première idée.').expect(CREE);

    await tenter(seance, 'Seconde idée.').expect(CREE);

    const lignes = await contexte().freeResponses.listerDuParticipant(
      seance.sessionId,
      seance.participantId,
    );
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

    const lignes = await contexte().freeResponses.listerDuParticipant(
      seance.sessionId,
      seance.participantId,
    );
    expect(lignes).toHaveLength(1);
    expect(lignes[0].premiereReponse).toMatch(/^Idée \d\.$/);
  });

  it('ne sert jamais les strategies au participant qui n a pas tente', async () => {
    const premier = await ouvrirSeance('77777777-7777-4777-8777-000000000005');
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
    const seance = await ouvrirSeance('77777777-7777-4777-8777-000000000008');
    const autre = await ouvrirSeance('77777777-7777-4777-8777-000000000009');

    const refus = await tenter(
      { ...seance, jeton: autre.jeton },
      'Je lis l’origine.',
    );

    expect(refus.status).toBe(NON_AUTORISE);
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
});
