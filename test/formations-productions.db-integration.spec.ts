import type { Response, Test } from 'supertest';
import type { ValeurProduction } from '../src/modules/formations/domain/contrats/resultats';
import {
  buildCoursAvecProductions,
  creerCatalogueDeTest,
} from './factories/cours.factory';
import { describeDb } from './helpers/db-integration-datasource';
import {
  CODE_HTTP,
  installerBancDeSeance,
  type SeanceDeTest,
} from './helpers/formations-banc-seance';

const COURS = buildCoursAvecProductions({
  slug: 'cours-productions-integration',
});
const CATALOGUE = creerCatalogueDeTest(COURS);
const DERNIER_ECRAN = COURS.ecrans.length - 1;
const FEUILLE_JUSTE: ValeurProduction = {
  type: 'feuille',
  cellules: { D2: '=(C2-B2)/B2', D3: '=(C3-B3)/B3' },
};
const CLASSEMENT_JUSTE: ValeurProduction = {
  type: 'classement',
  classement: { 'ca-2025': 'valeur', inflation: 'ambigu' },
};
const { CREE, SANS_CONTENU, INVALIDE, NON_AUTORISE, CONFLIT, INTROUVABLE } =
  CODE_HTTP;
const MAUVAISE_REQUETE = INVALIDE;
const PRODUCTIONS_SIMULTANEES = 6;

interface VerdictProduction {
  correcte: boolean;
  score: number;
  details: { cle: string; juste: boolean; libelleConfusion: string | null }[];
  libelleConfusion: string | null;
}

function codeDe(reponse: Response): string | undefined {
  return (reponse.body as { code?: string }).code;
}

describeDb('Route des productions (B5, B11, db integration)', () => {
  const banc = installerBancDeSeance({
    catalogue: CATALOGUE,
    slug: COURS.slug,
    ecran: DERNIER_ECRAN,
  });
  const contexte = () => banc.contexte();
  const formateur = banc.formateur;

  const produire = (sessionId: string, jeton: string, corps: object): Test =>
    banc
      .avecJeton('post', `/sessions/${sessionId}/productions`, jeton)
      .send(corps);

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
    expect(enregistree.details).toEqual([
      { cle: 'D2', juste: true, confusion: null },
      { cle: 'D3', juste: true, confusion: null },
    ]);
  });

  it('refuse le jeton d un participant d une autre seance', async () => {
    const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000002');
    const autre = await ouvrirSeance('44444444-4444-4444-8444-000000000003');

    const refus = await produire(seance.sessionId, autre.jeton, {
      questionId: 'Q-TEST-FEUILLE',
      valeur: FEUILLE_JUSTE,
      dureeMs: 1000,
    });

    expect(refus.status).toBe(NON_AUTORISE);
  });

  it('refuse une requete sans jeton de participant', async () => {
    const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000004');

    const refus = await banc
      .anonyme('post', `/sessions/${seance.sessionId}/productions`)
      .send({
        questionId: 'Q-TEST-FEUILLE',
        valeur: FEUILLE_JUSTE,
        dureeMs: 1000,
      });

    expect(refus.status).toBe(NON_AUTORISE);
  });

  it('refuse l identite du formateur, qui n est pas un participant', async () => {
    const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000005');

    const refus = await formateur(
      'post',
      `/sessions/${seance.sessionId}/productions`,
    ).send({
      questionId: 'Q-TEST-FEUILLE',
      valeur: FEUILLE_JUSTE,
      dureeMs: 1000,
    });

    expect(refus.status).toBe(NON_AUTORISE);
  });

  it('refuse une production vide', async () => {
    const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000006');

    const refus = await produire(seance.sessionId, seance.jeton, {
      questionId: 'Q-TEST-FEUILLE',
      valeur: { type: 'feuille', cellules: {} },
      dureeMs: 1000,
    });

    expect(refus.status).toBe(MAUVAISE_REQUETE);
    expect(codeDe(refus)).toBe('PRODUCTION_VIDE');
  });

  it('refuse une cellule hors de la grille du plan', async () => {
    const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000007');

    const refus = await produire(seance.sessionId, seance.jeton, {
      questionId: 'Q-TEST-FEUILLE',
      valeur: { type: 'feuille', cellules: { Z99: '=1' } },
      dureeMs: 1000,
    });

    expect(refus.status).toBe(MAUVAISE_REQUETE);
    expect(codeDe(refus)).toBe('PRODUCTION_INVALIDE');
  });

  it('refuse une question fermee, qui passe par la route des reponses', async () => {
    const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000008');

    const refus = await produire(seance.sessionId, seance.jeton, {
      questionId: 'Q-TEST-NUM',
      valeur: FEUILLE_JUSTE,
      dureeMs: 1000,
    });

    expect(refus.status).toBe(MAUVAISE_REQUETE);
    expect(codeDe(refus)).toBe('TYPE_DE_QUESTION');
  });

  it('refuse une production visant un ecran que le formateur n a pas projete', async () => {
    const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000009');
    await formateur('patch', `/sessions/${seance.sessionId}/control`)
      .send({ ecran: 0 })
      .expect(SANS_CONTENU);

    const refus = await produire(seance.sessionId, seance.jeton, {
      questionId: 'Q-TEST-FEUILLE',
      valeur: FEUILLE_JUSTE,
      dureeMs: 1000,
    });

    expect(refus.status).toBe(INTROUVABLE);
    expect(codeDe(refus)).toBe('ECRAN_NON_SERVI');
  });

  it('refuse un second classement sur le meme tri', async () => {
    const seance = await ouvrirSeance('44444444-4444-4444-8444-000000000010');
    await produire(seance.sessionId, seance.jeton, {
      questionId: 'Q-TEST-CLASSEMENT',
      valeur: CLASSEMENT_JUSTE,
      dureeMs: 1000,
    }).expect(CREE);

    const refus = await produire(seance.sessionId, seance.jeton, {
      questionId: 'Q-TEST-CLASSEMENT',
      valeur: CLASSEMENT_JUSTE,
      dureeMs: 1000,
    });

    expect(refus.status).toBe(CONFLIT);
    expect(codeDe(refus)).toBe('REPONSE_DEJA_ENREGISTREE');
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
        produire(seance.sessionId, seance.jeton, {
          questionId: 'Q-TEST-CLASSEMENT',
          valeur: CLASSEMENT_JUSTE,
          dureeMs: 1000,
        }),
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
});
