import request from 'supertest';
import type { Cours } from '../src/modules/formations/domain/contrats/cours';
import type {
  FeuilleEvaluee,
  SortiesMachine,
  TableauEvalue,
} from '../src/modules/formations/domain/contrats/donnees-publiques';
import type { SessionRecord } from '../src/modules/formations/domain/ISessions.repository';
import { LONGUEUR_MAX_FORMULE } from '../src/modules/formations/domain/cours/Formule';
import {
  EN_TETE_JETON,
  ParticipantTokenService,
} from '../src/modules/formations/interfaces/ParticipantToken.service';
import { buildCoursDuContenu } from './factories/contenus-de-cours.factory';
import {
  COURS_B2_01,
  COURS_B2_03,
  FORMULE_VISA_B2_03 as VISA,
  MACHINE_B2_01 as MACHINE,
  PLAN_TOILE_B2_01 as PLAN_TOILE,
  PLAN_VISA_B2_03 as PLAN_VISA,
} from './factories/contenus-publies';
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

const COURS_VISA = buildCoursDuContenu(COURS_B2_03);
const COURS_TOILE = buildCoursDuContenu(COURS_B2_01);
const POSTE = buildParticipantRecord({
  id: PARTICIPANT_ID,
  sessionId: SESSION_ID,
  seed: SEED,
});

const codeDe = (reponse: request.Response): unknown =>
  (reponse.body as { code?: string }).code;

const codeDuRefus = async (requete: request.Test): Promise<unknown> =>
  codeDe(await requete.expect(400));

function evaluationsEnSeance(cours: Cours) {
  const depots = createMockDepotsFormations();
  installerSecretDeSignature();
  const app = applicationDeLaSuite(() =>
    monterApplicationFormations(depots, creerCatalogueDeTest(cours)),
  );
  const seance = (etat: SessionRecord['etat'] = 'en_cours'): SessionRecord =>
    buildSeanceDuCours(cours, SEED, { etat, id: SESSION_ID });
  const jeton = (sessionId = SESSION_ID) =>
    app().get(ParticipantTokenService).sign(sessionId, PARTICIPANT_ID, 0);
  const evaluer = (
    chemin: string,
    corps: unknown,
    jetonDuPoste: string | null = jeton(),
  ): request.Test => {
    const requete = request(serveurHttpDe(app()))
      .post(routeFormations(`/sessions/${SESSION_ID}/${chemin}/evaluation`))
      .set('Content-Type', 'application/json');
    return (
      jetonDuPoste === null ? requete : requete.set(EN_TETE_JETON, jetonDuPoste)
    ).send(typeof corps === 'string' ? corps : JSON.stringify(corps));
  };

  beforeEach(() => {
    simulerSeance(depots, seance(), POSTE);
  });

  return { depots, seance, jeton, evaluer };
}

describe('Évaluation de la feuille de l élève (e2e http socket)', () => {
  const { depots, evaluer } = evaluationsEnSeance(COURS_VISA);
  const feuille = (corps: unknown, planId = PLAN_VISA): request.Test =>
    evaluer(`feuilles/${planId}`, corps);

  it('rend en 200 ce qu affiche chaque cellule, sans rien enregistrer', async () => {
    const reponse = await feuille({ cellules: { D2: VISA } }).expect(200);

    expect(reponse.body as FeuilleEvaluee).toMatchObject({
      saisies: { D2: VISA },
      formules: ['D2'],
      affichages: { A1: 'Facture', C2: '6400', D2: 'Visa' },
      natures: { A1: 'texte', C2: 'nombre', D2: 'texte' },
    });
    expect(depots.answers.create.mock.calls).toEqual([]);
  });

  it('applique la recopie vers le bas demandée par l élève', async () => {
    const reponse = await feuille({
      cellules: { D2: VISA },
      recopie: { de: 'D2' },
    }).expect(200);

    expect((reponse.body as FeuilleEvaluee).saisies.D3).toBe(
      '=SI(OU(C3>=5000;B3<>"France");"Visa";"Non")',
    );
  });

  it('refuse en 400 TYPE_DE_QUESTION un plan qui n est pas une feuille du cours', async () => {
    const refus = feuille(
      { cellules: { D2: '=1' } },
      'b2-01-a4-feuille-canaux',
    );

    expect(await codeDuRefus(refus)).toBe('TYPE_DE_QUESTION');
  });

  it.each([
    ['une cellule hors de la grille', { cellules: { Z99: '=1' } }],
    ['une clé qui n est pas une cellule', { cellules: { 'A1;DROP': '=1' } }],
    [
      'une recopie vers une cellule imposée',
      { cellules: {}, recopie: { de: 'C1' } },
    ],
  ])('refuse en 400 PRODUCTION_INVALIDE %s', async (_cas, corps) => {
    expect(await codeDuRefus(feuille(corps))).toBe('PRODUCTION_INVALIDE');
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
    await feuille(corps).expect(400);
  });

  it('ignore un prototype glissé dans les cellules, sans l évaluer ni polluer l objet', async () => {
    const reponse = await feuille(
      '{"cellules":{"__proto__":{"D2":"=1"}}}',
    ).expect(200);

    expect((reponse.body as FeuilleEvaluee).affichages.D2).toBeUndefined();
    expect(({} as Record<string, unknown>).D2).toBeUndefined();
  });
});

describe('Évaluation du tableau de l élève (e2e http socket)', () => {
  const { depots, evaluer } = evaluationsEnSeance(COURS_TOILE);
  const tableau = (corps: unknown, planId = PLAN_TOILE): request.Test =>
    evaluer(`tableaux/${planId}`, corps);
  const saisie = (rang: unknown, cle: unknown, texte: unknown = '1') => ({
    saisies: [{ rang, cle, saisie: texte }],
  });

  it('rend en 200 le coefficient déduit du prix saisi à la française, sans rien enregistrer', async () => {
    const reponse = await tableau(saisie(0, 'prix', '21,6')).expect(200);

    const evalue = reponse.body as TableauEvalue;
    expect([
      evalue.lignes[0].valeurs.prix,
      evalue.lignes[0].valeurs.coef,
      evalue.lignes[1].valeurs.coef,
    ]).toEqual([
      { valeur: 21.6, affichage: '21,60' },
      { valeur: 1.08, affichage: '1,0800' },
      { valeur: null, affichage: '—' },
    ]);
    expect(depots.answers.create.mock.calls).toEqual([]);
  });

  it('refuse en 400 TYPE_DE_QUESTION un plan qui n est pas un tableau du cours', async () => {
    const refus = tableau(saisie(0, 'prix'), 'b2-01-a4-feuille-canaux');

    expect(await codeDuRefus(refus)).toBe('TYPE_DE_QUESTION');
  });

  it.each([
    ['une colonne déduite', saisie(0, 'coef')],
    ['une colonne absente du plan', saisie(0, 'constructor')],
    ['une ligne au-delà du tableau', saisie(4, 'prix')],
  ])('refuse en 400 PRODUCTION_INVALIDE %s', async (_cas, corps) => {
    expect(await codeDuRefus(tableau(corps))).toBe('PRODUCTION_INVALIDE');
  });

  it.each([
    ['une clé hors contrat', { ...saisie(0, 'prix'), note: 20 }],
    ['un rang négatif', saisie(-1, 'prix')],
    ['un rang fractionnaire', saisie(0.5, 'prix')],
    ['une clé de prototype', saisie(0, '__proto__')],
    ['une saisie qui n est pas un texte', saisie(0, 'prix', 21.6)],
    [
      'une saisie trop longue',
      saisie(0, 'prix', '1'.repeat(LONGUEUR_MAX_FORMULE + 1)),
    ],
    [
      'plus de saisies que de cases possibles',
      {
        saisies: Array.from({ length: 401 }, () => ({
          rang: 0,
          cle: 'prix',
          saisie: '1',
        })),
      },
    ],
  ])('refuse en 400, à la validation, %s', async (_cas, corps) => {
    await tableau(corps).expect(400);
  });
});

describe('Évaluation de la machine de l élève (e2e http socket)', () => {
  const { depots, evaluer } = evaluationsEnSeance(COURS_TOILE);
  const machine = (corps: unknown, ecranId = MACHINE): request.Test =>
    evaluer(`machines/${ecranId}`, corps);

  it('rend en 200 la machine calculée aux réglages relâchés, sans rien enregistrer', async () => {
    const reponse = await machine({
      reglages: { tauxUn: 50, tauxDeux: -50 },
    }).expect(200);

    const sorties = reponse.body as SortiesMachine;
    expect(sorties.valeurs).toEqual({ depart: 100, tauxUn: 50, tauxDeux: -50 });
    expect(sorties.resultat.affichage).toBe('75');
    expect(sorties.etapes.map(({ affichage }) => affichage)).toEqual([
      '100',
      '150',
      '75',
    ]);
    expect(depots.answers.create.mock.calls).toEqual([]);
  });

  it('refuse en 400 TYPE_DE_QUESTION un écran du cours qui n est pas une machine', async () => {
    const refus = machine(
      { reglages: { origine: 0 } },
      'B2-01-A2-02-ORIGINE-AXE',
    );

    expect(await codeDuRefus(refus)).toBe('TYPE_DE_QUESTION');
  });

  it.each([
    ['un paramètre absent de la machine', { prix: 1 }],
    ['un réglage sous la borne', { tauxUn: -51 }],
    ['un réglage au-delà de la borne', { depart: 201 }],
  ])('refuse en 400 PRODUCTION_INVALIDE %s', async (_cas, reglages) => {
    expect(await codeDuRefus(machine({ reglages }))).toBe(
      'PRODUCTION_INVALIDE',
    );
  });

  it.each([
    ['une clé hors contrat', { reglages: { tauxUn: 1 }, note: 20 }],
    ['des réglages absents', {}],
    ['des réglages en liste', { reglages: [1, 2] }],
    ['un réglage qui n est pas un nombre', { reglages: { tauxUn: '50' } }],
  ])('refuse en 400, à la validation, %s', async (_cas, corps) => {
    await machine(corps).expect(400);
  });

  it.each([
    ['un prototype', '{"reglages":{"__proto__":{"tauxUn":51}}}'],
    ['une clé héritée d Object', '{"reglages":{"constructor":51}}'],
  ])(
    'ignore %s glissé dans les réglages, sans l appliquer ni polluer l objet',
    async (_cas, corps) => {
      const parDefaut = await machine({ reglages: {} }).expect(200);

      const reponse = await machine(corps).expect(200);

      expect(reponse.body).toEqual(parDefaut.body);
      expect(({} as Record<string, unknown>).tauxUn).toBeUndefined();
    },
  );
});

describe.each([
  [
    'la feuille',
    COURS_VISA,
    `feuilles/${PLAN_VISA}`,
    { cellules: { D2: VISA } },
    'Visa',
  ],
  [
    'le tableau',
    COURS_TOILE,
    `tableaux/${PLAN_TOILE}`,
    { saisies: [{ rang: 0, cle: 'prix', saisie: '21,6' }] },
    '1,0800',
  ],
  [
    'la machine',
    COURS_TOILE,
    `machines/${MACHINE}`,
    { reglages: { tauxUn: 50 } },
    '135',
  ],
] as const)(
  'Refus de l évaluation de %s hors d une séance ouverte au poste (e2e http socket)',
  (_nom, cours, chemin, corps, calcul) => {
    const { depots, seance, jeton, evaluer } = evaluationsEnSeance(cours);

    it('refuse en 409 SEANCE_NON_DEMARREE puis SEANCE_TERMINEE', async () => {
      depots.sessions.findById.mockResolvedValueOnce(seance('attente'));
      const attente = await evaluer(chemin, corps).expect(409);
      depots.sessions.findById.mockResolvedValueOnce(seance('terminee'));
      const terminee = await evaluer(chemin, corps).expect(409);

      expect([codeDe(attente), codeDe(terminee)]).toEqual([
        'SEANCE_NON_DEMARREE',
        'SEANCE_TERMINEE',
      ]);
    });

    it('refuse en 401 un appel sans jeton, puis un jeton émis pour une autre séance', async () => {
      const statuts = [
        (await evaluer(chemin, corps, null)).status,
        (await evaluer(chemin, corps, jeton(AUTRE_SESSION_ID))).status,
      ];

      expect(statuts).toEqual([401, 401]);
    });

    it('refuse en 404 PARTICIPANT_INTROUVABLE le poste évincé, sans rien calculer', async () => {
      depots.participants.findById.mockResolvedValue({
        ...POSTE,
        evinceLe: new Date('2026-10-15T10:00:00Z'),
      });

      const reponse = await evaluer(chemin, corps);

      expect({ statut: reponse.status, code: codeDe(reponse) }).toEqual({
        statut: 404,
        code: 'PARTICIPANT_INTROUVABLE',
      });
      expect(JSON.stringify(reponse.body)).not.toContain(calcul);
    });
  },
);
