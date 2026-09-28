import type {
  Cours,
  Ecran,
} from '../src/modules/formations/domain/contrats/cours';
import type { PilotageEcran } from '../src/modules/formations/domain/contrats/pilotage';
import type { ResultatsDeSeance } from '../src/modules/formations/domain/contrats/resultats';
import { questionsDe } from '../src/modules/formations/domain/cours/Cours';
import { activitesDeLEcran } from '../src/modules/formations/domain/cours/EcranServi';
import { describeDb } from './helpers/db-integration-datasource';
import { VERSION_PUBLIEE_SUR_BASE_NEUVE } from './helpers/formations-db';
import {
  clientFormations,
  installerBancFormationsVierge,
  type BancFormations,
  type ClientFormations,
} from './helpers/formations-harness';
import { silenceNestLogger } from './helpers/silence-nest-logger';

const SLUG = 'b2-02-series-statistiques';
const FORMATEUR = 'd4444444-4444-4444-8444-444444444444';
const SECRET = 'secret-de-test-seance-papier-assez-long';
const SYNTHESE_A = 'papier-formateur@example.test';
const OK = 200;
const CREE = 201;
const SANS_CONTENU = 204;
const DELAI_TEST_MS = 120_000;
const PHASES_APRES_LE_VOTE = ['discussion', 'revote', 'revele'] as const;

type Pilotage = { readonly screenId: string } & Partial<PilotageEcran>;

function pilotagesDuFormateur(ecran: Ecran): readonly Pilotage[] {
  const screenId = ecran.id;
  if (ecran.brique === 'fp-vote' && ecran.questionJumelle !== undefined) {
    return PHASES_APRES_LE_VOTE.map((phase) => ({ screenId, phase }));
  }
  const pilotages: Pilotage[] = [];
  if (ecran.brique === 'fp-recall') {
    pilotages.push({ screenId, optionsAffichees: true });
  }
  if (ecran.brique === 'fp-worked') {
    for (const [rang] of ecran.proprietes.exemple.etapes.entries()) {
      pilotages.push({ screenId, etayage: rang + 1 });
    }
  }
  const porteUnCorrige =
    ecran.brique === 'fp-challenge' ||
    questionsDe(ecran).length > 0 ||
    activitesDeLEcran(ecran).length > 0;
  if (porteUnCorrige) {
    pilotages.push({ screenId, revele: true });
  }
  return pilotages;
}

describeDb('Seance du B2-02 en mode papier (db integration)', () => {
  silenceNestLogger();

  let banc: BancFormations;
  let client: ClientFormations;
  let cours: Cours;
  let sessionId: string;

  const piloter = (corps: Record<string, unknown>) =>
    client.formateur('patch', `/sessions/${sessionId}/control`).send(corps);

  installerBancFormationsVierge(
    { secret: SECRET, syntheseA: SYNTHESE_A },
    async (monte) => {
      banc = monte;
      client = clientFormations(banc.app, FORMATEUR);
      const publie = await banc.contexte.catalogue.trouver(
        SLUG,
        VERSION_PUBLIEE_SUR_BASE_NEUVE,
      );
      if (publie === null) {
        throw new Error(`Le cours ${SLUG} manque a la base migree`);
      }
      cours = publie;
    },
  );

  it(
    'projette chaque ecran sans aucun poste et le formateur revele chaque corrige',
    async () => {
      const ouverture = await client
        .formateur('post', '/sessions')
        .send({ courseSlug: SLUG })
        .expect(CREE);
      sessionId = (ouverture.body as { sessionId: string }).sessionId;
      await client
        .formateur('post', `/sessions/${sessionId}/start`)
        .expect(SANS_CONTENU);

      const refus: string[] = [];
      const reveles: string[] = [];
      for (const [rang, ecran] of cours.ecrans.entries()) {
        const servi = await piloter({ ecran: rang });
        if (servi.status !== SANS_CONTENU) {
          refus.push(`ecran ${rang} : ${servi.status}`);
        }
        for (const pilotage of pilotagesDuFormateur(ecran)) {
          const pilote = await piloter({ pilotage });
          if (pilote.status !== SANS_CONTENU) {
            refus.push(`${JSON.stringify(pilotage)} : ${pilote.status}`);
          }
          if (pilotage.revele === true || pilotage.phase === 'revele') {
            reveles.push(ecran.id);
          }
        }
      }

      const seance = await banc.contexte.sessions.findById(sessionId);
      const pilotageEnBase = seance?.pilotageEcrans ?? {};
      expect(refus).toEqual([]);
      expect(reveles.length).toBeGreaterThan(0);
      expect(
        reveles.filter(
          (screenId) =>
            pilotageEnBase[screenId]?.revele !== true &&
            pilotageEnBase[screenId]?.phase !== 'revele',
        ),
      ).toEqual([]);
      expect(seance?.ecranCourant).toBe(cours.ecrans.length - 1);
    },
    DELAI_TEST_MS,
  );

  it(
    'clot la seance sans participant et produit la synthese du formateur',
    async () => {
      await client
        .formateur('post', `/sessions/${sessionId}/close`)
        .expect(SANS_CONTENU);

      const rapport = await client
        .formateur('get', `/sessions/${sessionId}/report`)
        .expect(OK);
      const bilan = rapport.body as ResultatsDeSeance;
      const seance = await banc.contexte.sessions.findById(sessionId);

      expect({
        etat: seance?.etat,
        participants: bilan.participants.length,
        synthese: banc.mailer.sendSyntheseFormateur.mock.calls.length,
        copies: banc.mailer.sendCopieEtudiant.mock.calls.length,
      }).toEqual({ etat: 'terminee', participants: 0, synthese: 1, copies: 0 });
      expect(JSON.stringify(bilan)).not.toContain('[object Object]');
    },
    DELAI_TEST_MS,
  );
});
