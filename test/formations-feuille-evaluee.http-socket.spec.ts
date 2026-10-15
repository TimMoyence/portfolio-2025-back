import request from 'supertest';
import type { FeuilleEvaluee } from '../src/modules/formations/domain/contrats/donnees-publiques';
import type { SessionRecord } from '../src/modules/formations/domain/ISessions.repository';
import { LONGUEUR_MAX_FORMULE } from '../src/modules/formations/domain/cours/Formule';
import {
  EN_TETE_JETON,
  ParticipantTokenService,
} from '../src/modules/formations/interfaces/ParticipantToken.service';
import { buildCoursDuContenu } from './factories/contenus-de-cours.factory';
import { COURS_B2_03 } from './factories/contenus-publies';
import {
  buildSeanceDuCours,
  creerCatalogueDeTest,
} from './factories/cours.factory';
import {
  buildParticipantRecord,
  createMockDepotsFormations,
} from './factories/formation.factory';
import {
  monterApplicationFormations,
  routeFormations,
  serveurHttpDe,
  simulerSeance,
} from './helpers/formations-harness';
import { installerSecretDeSignature } from './helpers/env-formations';
import { applicationDeLaSuite } from './helpers/nest-test-app';

const SESSION_ID = 'c3333333-3333-4333-8333-333333333333';
const AUTRE_SESSION_ID = 'd4444444-4444-4444-8444-444444444444';
const PARTICIPANT_ID = 'e5555555-5555-4555-8555-555555555555';
const SEED = 4242;

const COURS = buildCoursDuContenu(COURS_B2_03);
const PLAN_VISA = 'b2-03-a1-tableur-si-ou';
const VISA = '=SI(OU(C2>=5000;B2<>"France");"Visa";"Non")';
const POSTE = buildParticipantRecord({
  id: PARTICIPANT_ID,
  sessionId: SESSION_ID,
  seed: SEED,
});

const seance = (etat: SessionRecord['etat'] = 'en_cours'): SessionRecord =>
  buildSeanceDuCours(COURS, SEED, { etat, id: SESSION_ID });

describe('Évaluation de la feuille de l élève (e2e http socket)', () => {
  const depots = createMockDepotsFormations();
  installerSecretDeSignature();
  const app = applicationDeLaSuite(() =>
    monterApplicationFormations(depots, creerCatalogueDeTest(COURS)),
  );

  const jeton = (sessionId = SESSION_ID) =>
    app().get(ParticipantTokenService).sign(sessionId, PARTICIPANT_ID, 0);
  const evaluer = (
    corps: unknown,
    planId = PLAN_VISA,
    jetonDuPoste: string | null = jeton(),
  ): request.Test => {
    const requete = request(serveurHttpDe(app()))
      .post(
        routeFormations(
          `/sessions/${SESSION_ID}/feuilles/${planId}/evaluation`,
        ),
      )
      .set('Content-Type', 'application/json');
    return (
      jetonDuPoste === null ? requete : requete.set(EN_TETE_JETON, jetonDuPoste)
    ).send(typeof corps === 'string' ? corps : JSON.stringify(corps));
  };
  const codeDe = (reponse: request.Response): unknown =>
    (reponse.body as { code?: string }).code;

  beforeEach(() => {
    simulerSeance(depots, seance(), POSTE);
  });

  it('rend en 200 ce qu affiche chaque cellule, sans rien enregistrer', async () => {
    const reponse = await evaluer({ cellules: { D2: VISA } }).expect(200);

    const feuille = reponse.body as FeuilleEvaluee;
    expect(feuille).toMatchObject({
      saisies: { D2: VISA },
      formules: ['D2'],
      affichages: { A1: 'Facture', C2: '6400', D2: 'Visa' },
      natures: { A1: 'texte', C2: 'nombre', D2: 'texte' },
    });
    expect(depots.answers.create.mock.calls).toEqual([]);
  });

  it('applique la recopie vers le bas demandée par l élève', async () => {
    const reponse = await evaluer({
      cellules: { D2: VISA },
      recopie: { de: 'D2' },
    }).expect(200);

    expect((reponse.body as FeuilleEvaluee).saisies.D3).toBe(
      '=SI(OU(C3>=5000;B3<>"France");"Visa";"Non")',
    );
  });

  it('refuse en 400 TYPE_DE_QUESTION un plan qui n est pas une feuille du cours', async () => {
    const reponse = await evaluer(
      { cellules: { D2: '=1' } },
      'b2-01-a4-feuille-canaux',
    ).expect(400);

    expect(codeDe(reponse)).toBe('TYPE_DE_QUESTION');
  });

  it.each([
    ['une cellule hors de la grille', { cellules: { Z99: '=1' } }],
    ['une clé qui n est pas une cellule', { cellules: { 'A1;DROP': '=1' } }],
    [
      'une recopie vers une cellule imposée',
      { cellules: {}, recopie: { de: 'C1' } },
    ],
  ])('refuse en 400 PRODUCTION_INVALIDE %s', async (_cas, corps) => {
    const reponse = await evaluer(corps).expect(400);

    expect(codeDe(reponse)).toBe('PRODUCTION_INVALIDE');
  });

  it.each([
    ['une clé hors contrat', { cellules: { D2: '=1' }, note: 20 }],
    [
      'une formule trop longue',
      { cellules: { D2: `=${'1+'.repeat(LONGUEUR_MAX_FORMULE)}1` } },
    ],
    ['une saisie qui n est pas un texte', { cellules: { D2: 12 } }],
    ['une recopie sans source', { cellules: {}, recopie: {} }],
  ])('refuse en 400, à la validation, %s', async (_cas, corps) => {
    await evaluer(corps).expect(400);
  });

  it('ignore un prototype glissé dans les cellules, sans l évaluer ni polluer l objet', async () => {
    const reponse = await evaluer(
      '{"cellules":{"__proto__":{"D2":"=1"}}}',
    ).expect(200);

    expect((reponse.body as FeuilleEvaluee).affichages.D2).toBeUndefined();
    expect(({} as Record<string, unknown>).D2).toBeUndefined();
  });

  it('refuse en 409 SEANCE_NON_DEMARREE puis SEANCE_TERMINEE', async () => {
    depots.sessions.findById.mockResolvedValueOnce(seance('attente'));
    const attente = await evaluer({ cellules: { D2: VISA } }).expect(409);
    depots.sessions.findById.mockResolvedValueOnce(seance('terminee'));
    const terminee = await evaluer({ cellules: { D2: VISA } }).expect(409);

    expect([codeDe(attente), codeDe(terminee)]).toEqual([
      'SEANCE_NON_DEMARREE',
      'SEANCE_TERMINEE',
    ]);
  });

  it('refuse en 401 un appel sans jeton, puis un jeton émis pour une autre séance', async () => {
    const statuts = [
      (await evaluer({ cellules: { D2: VISA } }, PLAN_VISA, null)).status,
      (
        await evaluer(
          { cellules: { D2: VISA } },
          PLAN_VISA,
          jeton(AUTRE_SESSION_ID),
        )
      ).status,
    ];

    expect(statuts).toEqual([401, 401]);
  });

  it('refuse en 404 PARTICIPANT_INTROUVABLE le poste évincé, sans rien calculer', async () => {
    depots.participants.findById.mockResolvedValue({
      ...POSTE,
      evinceLe: new Date('2026-10-15T10:00:00Z'),
    });

    const reponse = await evaluer({ cellules: { D2: VISA } });

    expect({ statut: reponse.status, code: codeDe(reponse) }).toEqual({
      statut: 404,
      code: 'PARTICIPANT_INTROUVABLE',
    });
    expect(JSON.stringify(reponse.body)).not.toContain('Visa');
  });
});
