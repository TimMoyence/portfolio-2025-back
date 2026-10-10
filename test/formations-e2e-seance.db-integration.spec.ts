import request from 'supertest';
import type { Response, Test } from 'supertest';
import { GetSessionResultsUseCase } from '../src/modules/formations/application/GetSessionResults.useCase';
import type { ResultatsDeSeance } from '../src/modules/formations/domain/contrats/resultats';
import { DELAI_MIN_BILAN_MS } from '../src/modules/formations/application/StreamSession.useCase';
import type {
  Cours,
  Ecran,
  Question,
  QuestionProduction,
} from '../src/modules/formations/domain/contrats/cours';
import type { EtatParticipant } from '../src/modules/formations/domain/contrats/pilotage';
import type { EcranPublic } from '../src/modules/formations/domain/contrats/tirage';
import type { ValeurProduction } from '../src/modules/formations/domain/contrats/resultats';
import {
  estReservee,
  questionsDe,
} from '../src/modules/formations/domain/cours/Cours';
import { activitesLibres } from '../src/modules/formations/domain/cours/EcranServi';
import {
  tirer,
  type TirageDuCours,
} from '../src/modules/formations/domain/cours/Tirage';
import { NE_SAIT_PAS } from '../src/modules/formations/domain/GradingCore';
import type { ContenuDeCours } from '../src/modules/formations/domain/cours/CoursStocke';
import { EN_TETE_JETON } from '../src/modules/formations/interfaces/ParticipantToken.service';
import {
  COURS_B2_01,
  COURS_B2_02,
  COURS_B2_03,
  COURS_B2_04,
  COURS_B2_05,
  COURS_B2_06,
  COURS_B3_01,
} from './factories/contenus-publies';
import { prefixeDuCours } from './factories/contenus-de-cours.factory';
import {
  classeursReservesDe,
  octetsDuClasseur,
} from './helpers/classeurs-reserves';
import { clesSecretesDans } from './helpers/cles-du-corrige';
import { describeDb } from './helpers/db-integration-datasource';
import { CODE_HTTP, codeDe } from './helpers/formations-banc-seance';
import {
  TABLES_DE_SEANCE,
  VERSION_PUBLIEE_SUR_BASE_NEUVE,
} from './helpers/formations-db';
import {
  abonnerAuFlux,
  attendreQue,
  coursDuCatalogue,
  EN_TETE_IDENTITE,
  installerBancFormationsVierge,
  routeFormations,
  serveurHttpDe,
  type BancFormations,
  type FluxEcoute,
} from './helpers/formations-harness';
import {
  bonneValeur,
  estProduction,
  productionJuste,
  productionVide,
  reponseDEnigme,
  valeurPiegee,
} from './helpers/reponses-de-cours';
import { silenceNestLogger } from './helpers/silence-nest-logger';

const VERSION_COURS = VERSION_PUBLIEE_SUR_BASE_NEUVE;
const VERSION_DU_BAREME = 2;
const TYPES_NOTABLES = 5;
const CAPACITE = 4;
const FORMATEUR = 'e1111111-1111-4111-8111-111111111111:teacher';
const SECRET = 'secret-de-test-formations-assez-long-1234';
const SYNTHESE_A = 'e2e-formateur@example.test';
const DUREE_MS = 30_000;
const DELAI_TEST_MS = 900_000;
const DELAI_FLUX_MS = 20_000;
const MARGE_DU_DEBIT = 2;
const FORMULE_HORS_SUJET = '=123456789';
const TABLES_HORS_SEANCE = ['formation_mastery'];

const { OK, CREE, SANS_CONTENU, INVALIDE, INTROUVABLE, CONFLIT } = CODE_HTTP;

function parOrdreAlphabetique(gauche: string, droite: string): number {
  return gauche.localeCompare(droite);
}

function piecesJointesDe(ecrans: readonly EcranPublic[]): [string, unknown][] {
  return ecrans.flatMap((ecran) =>
    ecran.pieceJointe === undefined
      ? []
      : [[ecran.id, ecran.pieceJointe] as [string, unknown]],
  );
}

function piecesJointesAttendues(
  cours: Cours,
  ids: readonly string[],
): [string, unknown][] {
  return ids.map((id) => {
    const pieceJointe = cours.ecrans.find(
      (ecran) => ecran.id === id,
    )?.pieceJointe;
    return [
      id,
      pieceJointe !== undefined && estReservee(pieceJointe)
        ? { libelle: pieceJointe.libelle, reservee: true }
        : pieceJointe,
    ];
  });
}

function idsDesRappels(reponse: Response): string[] {
  return (
    reponse.body as { questions: { questionId: string }[] }
  ).questions.map((question) => question.questionId);
}

type Profil = 'juste' | 'piege' | 'ignorant';
type Methode = 'get' | 'post' | 'patch' | 'put' | 'delete';

interface Poste {
  readonly nom: string;
  readonly profil: Profil;
  participantId: string;
  jeton: string;
  graine: number;
  tirage: TirageDuCours | null;
}

function posteDe(nom: string, profil: Profil): Poste {
  return {
    nom,
    profil,
    participantId: '',
    jeton: '',
    graine: 0,
    tirage: null,
  };
}

interface Inscription {
  participantId: string;
  jeton: string;
  seed: number;
}

interface Ouverture {
  sessionId: string;
  code: string;
}

interface AttenduDuCours {
  readonly questionsNotees: number;
  readonly cellulesDesFeuilles: readonly number[];
  readonly exerciceEnAvance: string;
  readonly jalons: number;
  readonly enigmes: number;
  readonly piecesJointes: readonly string[];
  readonly piecesJointesAuCatalogue: readonly string[];
  readonly classeursReserves: readonly string[];
  readonly intervalleLibre: {
    readonly premier: number;
    readonly dernier: number;
  };
}

function seanceComplete(
  contenu: ContenuDeCours,
  attendu: AttenduDuCours,
): void {
  const SLUG = contenu.slug;
  const ECRANS_DU_COURS = contenu.ecrans.length;
  const PREFIXE = prefixeDuCours(contenu);
  const mesures: string[] = [];
  const briquesJouees = new Set<string>();
  const conflitsObserves = new Set<string>();

  const noterConflit = (reponse: Response): Response => {
    const code = codeDe(reponse);
    if (code !== undefined) {
      conflitsObserves.add(code);
    }
    return reponse;
  };

  describeDb(
    `E2E-01 seance complete du ${PREFIXE} publie (db integration)`,
    () => {
      silenceNestLogger();

      let banc: BancFormations;
      let cours: Cours;
      let sessionId: string;
      let codeDeJonction: string;
      let fluxFormateurA: FluxEcoute;
      let fluxFormateurB: FluxEcoute;
      let fluxEtudiant: FluxEcoute;
      let debutDesFlux = 0;
      let finDesFlux = 0;
      let calculsDeBilan = 0;
      let bilanEspionne: jest.SpyInstance;

      const postes: Poste[] = [
        posteDe('E1', 'juste'),
        posteDe('E2', 'piege'),
        posteDe('E3', 'ignorant'),
        posteDe('E4', 'juste'),
      ];
      const evince: Poste = posteDe('X', 'juste');

      const serveur = () => serveurHttpDe(banc.app);

      const chemin = routeFormations;

      const avecIdentite = (
        methode: Methode,
        suffixe: string,
        identite: string,
      ): Test =>
        request(serveur())
          [methode](chemin(suffixe))
          .set(EN_TETE_IDENTITE, identite);

      const formateur = (methode: Methode, suffixe: string): Test =>
        avecIdentite(methode, suffixe, FORMATEUR);

      const poste = (methode: Methode, suffixe: string, jeton: string): Test =>
        request(serveur())[methode](chemin(suffixe)).set(EN_TETE_JETON, jeton);

      const pieceJointeAuPoste = (ecranId: string, jeton: string): Test =>
        poste('get', `/sessions/${sessionId}/pieces-jointes/${ecranId}`, jeton);

      const piloter = (corps: Record<string, unknown>): Test =>
        formateur('patch', `/sessions/${sessionId}/control`).send(corps);

      const valeurDe = (unPoste: Poste, question: Question): unknown => {
        if (unPoste.tirage === null) {
          throw new Error(`Le poste ${unPoste.nom} n est pas inscrit`);
        }
        if (unPoste.profil === 'ignorant') {
          return NE_SAIT_PAS;
        }
        const solution = unPoste.tirage.solutions[question.id];
        return unPoste.profil === 'piege'
          ? valeurPiegee(question, solution).valeur
          : bonneValeur(question, solution);
      };

      const repondre = (unPoste: Poste, question: Question): Test =>
        poste('post', `/sessions/${sessionId}/answers`, unPoste.jeton).send({
          questionId: question.id,
          valeur: valeurDe(unPoste, question),
          dureeMs: DUREE_MS,
        });

      const signaler = (unPoste: Poste): Test =>
        poste('post', `/sessions/${sessionId}/incidents`, unPoste.jeton).send({
          incidents: [
            { type: 'tab_hidden', horodatage: new Date().toISOString() },
          ],
        });

      const ecrireLibrement = (
        unPoste: Poste,
        corps: { screenId: string; activityId?: string; response: string },
      ): Test =>
        poste(
          'post',
          `/sessions/${sessionId}/free-responses`,
          unPoste.jeton,
        ).send({
          ...corps,
          dureeMs: DUREE_MS,
        });

      const catalogueServi = async <T>(): Promise<T> =>
        (
          await request(serveur())
            .get(chemin(`/catalogue/${SLUG}`))
            .expect(OK)
        ).body as T;

      const produire = (
        unPoste: Poste,
        question: QuestionProduction,
        valeur: ValeurProduction,
      ): Test =>
        poste('post', `/sessions/${sessionId}/productions`, unPoste.jeton).send(
          {
            questionId: question.id,
            valeur,
            dureeMs: DUREE_MS,
          },
        );

      const inscrire = async (unPoste: Poste): Promise<Response> => {
        const reponse = await request(serveur())
          .post(chemin(`/sessions/${codeDeJonction}/join`))
          .send({
            prenom: `Prenom-${unPoste.nom}`,
            nom: `Nom-${unPoste.nom}`,
            email: `${unPoste.nom.toLowerCase()}@example.test`,
          });
        if (reponse.status === CREE) {
          const inscrit = reponse.body as Inscription;
          unPoste.participantId = inscrit.participantId;
          unPoste.jeton = inscrit.jeton;
          unPoste.graine = await banc.contexte.graineDe(inscrit.participantId);
          unPoste.tirage = tirer(cours, unPoste.graine);
        }
        return reponse;
      };

      const ecranFacultatif = <B extends Ecran['brique']>(
        brique: B,
      ): Extract<Ecran, { readonly brique: B }> | undefined =>
        cours.ecrans.find(
          (ecran): ecran is Extract<Ecran, { readonly brique: B }> =>
            ecran.brique === brique,
        );

      const ecranDe = (brique: Ecran['brique']): Ecran => {
        const trouve = ecranFacultatif(brique);
        if (trouve === undefined) {
          throw new Error(`Le ${PREFIXE} publie n a aucun ecran ${brique}`);
        }
        return trouve;
      };

      const piecesJointesDuCours = (
        ids: readonly string[],
      ): [string, unknown][] => piecesJointesAttendues(cours, ids);

      const ecranDuSujet = async (
        ecranId: string,
      ): Promise<EcranPublic | undefined> =>
        (
          (
            await poste(
              'get',
              `/sessions/${sessionId}/sujet`,
              postes[0].jeton,
            ).expect(OK)
          ).body as { ecrans: EcranPublic[] }
        ).ecrans.find((servi) => servi.id === ecranId);

      const productionDe = (ecran: Ecran): QuestionProduction => {
        const question = questionsDe(ecran).find(estProduction);
        if (question === undefined) {
          throw new Error(`L ecran ${ecran.id} n a aucune production`);
        }
        return question;
      };

      const jouerQuestionsFermees = async (ecran: Ecran): Promise<void> => {
        for (const question of questionsDe(ecran)) {
          for (const unPoste of postes) {
            await repondre(unPoste, question).expect(CREE);
          }
        }
      };

      const signalerUnIncident = async (): Promise<void> => {
        await signaler(postes[1]).expect(SANS_CONTENU);
      };

      const retardataire = (): Poste => postes[2];

      const voterSaufLeRetardataire = async (
        question: Question,
      ): Promise<void> => {
        for (const unPoste of postes.filter(
          (candidat) => candidat !== retardataire(),
        )) {
          await repondre(unPoste, question).expect(CREE);
        }
      };

      const jouerVoteSimple = async (ecran: Ecran): Promise<void> => {
        if (ecran.brique !== 'fp-vote') {
          throw new Error(`L ecran ${ecran.id} n est pas un vote`);
        }
        await voterSaufLeRetardataire(ecran.question);
        await piloter({
          pilotage: { screenId: ecran.id, revele: true },
        }).expect(SANS_CONTENU);
        const apresRevelation = noterConflit(
          await repondre(retardataire(), ecran.question),
        );
        const retourEnArriere = noterConflit(
          await piloter({ pilotage: { screenId: ecran.id, revele: false } }),
        );

        expect({
          apresRevelation: [apresRevelation.status, codeDe(apresRevelation)],
          retourEnArriere: [retourEnArriere.status, codeDe(retourEnArriere)],
        }).toEqual({
          apresRevelation: [CONFLIT, 'PHASE_FERMEE'],
          retourEnArriere: [CONFLIT, 'PHASE_NON_MONOTONE'],
        });
      };

      const jouerVote = async (ecran: Ecran): Promise<void> => {
        if (ecran.brique !== 'fp-vote') {
          throw new Error(`L ecran ${ecran.id} n est pas un vote`);
        }
        if (ecran.questionJumelle === undefined) {
          await jouerVoteSimple(ecran);
          return;
        }
        const jumelleFermee = noterConflit(
          await repondre(postes[0], ecran.questionJumelle),
        );
        await voterSaufLeRetardataire(ecran.question);
        await piloter({
          pilotage: { screenId: ecran.id, phase: 'discussion' },
        }).expect(SANS_CONTENU);
        const principaleFermee = noterConflit(
          await repondre(retardataire(), ecran.question),
        );
        await piloter({
          pilotage: { screenId: ecran.id, phase: 'revote' },
        }).expect(SANS_CONTENU);
        for (const unPoste of postes) {
          await repondre(unPoste, ecran.questionJumelle).expect(CREE);
        }
        await piloter({
          pilotage: { screenId: ecran.id, phase: 'revele' },
        }).expect(SANS_CONTENU);
        const retourEnArriere = noterConflit(
          await piloter({ pilotage: { screenId: ecran.id, phase: 'vote' } }),
        );

        expect({
          jumelleAvantRevote: [jumelleFermee.status, codeDe(jumelleFermee)],
          principaleEnDiscussion: [
            principaleFermee.status,
            codeDe(principaleFermee),
          ],
          retourEnArriere: [retourEnArriere.status, codeDe(retourEnArriere)],
        }).toEqual({
          jumelleAvantRevote: [CONFLIT, 'PHASE_FERMEE'],
          principaleEnDiscussion: [CONFLIT, 'PHASE_FERMEE'],
          retourEnArriere: [CONFLIT, 'PHASE_NON_MONOTONE'],
        });
      };

      const jouerProductions = async (ecran: Ecran): Promise<void> => {
        const question = productionDe(ecran);
        const juste = productionJuste(question);
        const vide = noterConflit(
          await produire(postes[0], question, productionVide(question)),
        );
        expect([ecran.id, vide.status, codeDe(vide)]).toEqual([
          ecran.id,
          INVALIDE,
          'PRODUCTION_VIDE',
        ]);
        for (const unPoste of postes) {
          const valeur: ValeurProduction =
            unPoste.profil === 'ignorant'
              ? { type: juste.type, neSaitPas: true }
              : juste;
          await produire(unPoste, question, valeur).expect(CREE);
        }
      };

      const jouerFeuille = async (ecran: Ecran): Promise<void> => {
        const question = productionDe(ecran);
        const juste = productionJuste(question);
        if (!('cellules' in juste)) {
          throw new Error(`L ecran ${ecran.id} ne porte pas de feuille`);
        }
        const cellulesAttendues =
          attendu.cellulesDesFeuilles[
            cours.ecrans
              .filter((candidat) => candidat.brique === 'fp-sheet')
              .findIndex((candidat) => candidat.id === ecran.id)
          ];
        const [premiere, ...suite] = Object.keys(juste.cellules);
        const recopiee: ValeurProduction = {
          type: 'feuille',
          cellules: { ...juste.cellules, [premiere]: FORMULE_HORS_SUJET },
        };
        const vide = noterConflit(
          await produire(postes[0], question, productionVide(question)),
        );
        const parfaite = await produire(postes[0], question, juste).expect(
          CREE,
        );
        const fautive = await produire(postes[1], question, recopiee).expect(
          CREE,
        );
        await produire(postes[2], question, {
          type: 'feuille',
          neSaitPas: true,
        }).expect(CREE);
        await produire(postes[3], question, juste).expect(CREE);

        type VerdictFeuille = {
          correcte: boolean;
          score: number;
          details: {
            cle: string;
            juste: boolean;
            libelleConfusion: string | null;
          }[];
        };
        const verdictParfait = parfaite.body as VerdictFeuille;
        const verdictFautif = fautive.body as VerdictFeuille;
        const aRevoir = verdictFautif.details.filter(
          (cellule) => !cellule.juste,
        );
        expect({
          vide: [vide.status, codeDe(vide)],
          cellules: verdictParfait.details.length,
          parfaite: verdictParfait.correcte,
          scoreParfait: verdictParfait.score,
          aRevoirParfaite: verdictParfait.details.filter(
            (cellule) => !cellule.juste,
          ).length,
          cellulePiegee: aRevoir.some((cellule) => cellule.cle === premiere),
          confusionNommee: aRevoir.some(
            (cellule) => cellule.libelleConfusion !== null,
          ),
          restantes: suite.length,
        }).toEqual({
          vide: [INVALIDE, 'PRODUCTION_VIDE'],
          cellules: cellulesAttendues,
          parfaite: true,
          scoreParfait: 1,
          aRevoirParfaite: 0,
          cellulePiegee: true,
          confusionNommee: true,
          restantes: cellulesAttendues - 1,
        });
        expect(aRevoir.length).toBeGreaterThan(0);
        expect(verdictFautif.score).toBeLessThan(1);
      };

      const jouerCoffre = async (ecran: Ecran): Promise<void> => {
        if (ecran.brique !== 'fp-escape') {
          throw new Error(`L ecran ${ecran.id} n est pas un coffre`);
        }
        const parcours = ecran.proprietes.parcours;
        const tenter = (
          unPoste: Poste,
          enigmeId: string,
          reponse: string,
        ): Test =>
          poste(
            'post',
            `/sessions/${sessionId}/escape/${parcours.id}/tentatives`,
            unPoste.jeton,
          ).send({ enigmeId, reponse, dureeMs: DUREE_MS });

        const derniere = ecran.enigmes[ecran.enigmes.length - 1];
        const verrouillee = noterConflit(
          await tenter(postes[1], derniere.id, reponseDEnigme(derniere)),
        );

        const fragments: (string | null)[] = [];
        for (const enigme of ecran.enigmes) {
          const verdict = await tenter(
            postes[0],
            enigme.id,
            reponseDEnigme(enigme),
          ).expect(CREE);
          fragments.push(
            (verdict.body as { fragment: string | null }).fragment ?? null,
          );
        }

        const premiere = ecran.enigmes[0];
        for (let rang = 0; rang < parcours.tentativesMax; rang += 1) {
          await tenter(postes[1], premiere.id, `${String(1000 + rang)}`).expect(
            CREE,
          );
        }
        const epuisees = noterConflit(
          await tenter(postes[1], premiere.id, '999999'),
        );

        expect({
          verrouillee: [verrouillee.status, codeDe(verrouillee)],
          epuisees: [epuisees.status, codeDe(epuisees)],
          resolues: fragments.length,
          sansFragment: fragments.filter((fragment) => fragment === null)
            .length,
        }).toEqual({
          verrouillee: [CONFLIT, 'ENIGME_VERROUILLEE'],
          epuisees: [CONFLIT, 'TENTATIVES_EPUISEES'],
          resolues: ecran.enigmes.length,
          sansFragment: 0,
        });
      };

      const jouerJalon = async (ecran: Ecran): Promise<void> => {
        if (ecran.brique !== 'fp-pulse') {
          throw new Error(`L ecran ${ecran.id} n est pas un jalon`);
        }
        const etats = {
          juste: 'clair',
          piege: 'perdu',
          ignorant: 'ca-va',
        } as const;
        for (const unPoste of postes) {
          await poste(
            'put',
            `/sessions/${sessionId}/pulses/${ecran.proprietes.sondage.id}`,
            unPoste.jeton,
          )
            .send({ etat: etats[unPoste.profil] })
            .expect(SANS_CONTENU);
        }
        await poste(
          'put',
          `/sessions/${sessionId}/pulses/${ecran.proprietes.sondage.id}`,
          postes[2].jeton,
        )
          .send({ etat: 'clair' })
          .expect(SANS_CONTENU);
      };

      const jouerDefi = async (ecran: Ecran): Promise<void> => {
        if (ecran.brique !== 'fp-challenge') {
          throw new Error(`L ecran ${ecran.id} n est pas un defi`);
        }
        const defiId = ecran.proprietes.probleme.id;
        const strategies = (unPoste: Poste): Test =>
          poste(
            'get',
            `/sessions/${sessionId}/defis/${defiId}/strategies`,
            unPoste.jeton,
          );
        const tenter = (unPoste: Poste, texte: string): Test =>
          poste(
            'post',
            `/sessions/${sessionId}/defis/${defiId}/tentative`,
            unPoste.jeton,
          ).send({ texte, dureeMs: DUREE_MS });

        const avantTentative = await strategies(postes[0]);
        const premiere = await tenter(postes[0], 'Je lis l origine de l axe.');
        await tenter(postes[0], 'Seconde idee, apres coup.').expect(CREE);
        for (const unPoste of postes.slice(1)) {
          await tenter(unPoste, `Piste du poste ${unPoste.nom}.`).expect(CREE);
        }
        const avantRevelation = await strategies(postes[0]).expect(OK);
        await piloter({
          pilotage: { screenId: ecran.id, revele: true },
        }).expect(SANS_CONTENU);
        const apresRevelation = await strategies(postes[0]).expect(OK);

        const listeDe = (reponse: Response): { fausse?: boolean }[] =>
          (reponse.body as { strategies: { fausse?: boolean }[] }).strategies;
        expect({
          avantTentative: avantTentative.status,
          premiere: premiere.status,
          justesseAvant: listeDe(avantRevelation).some(
            (piste) => 'fausse' in piste,
          ),
          justesseApres: listeDe(apresRevelation).every(
            (piste) => 'fausse' in piste,
          ),
        }).toEqual({
          avantTentative: INTROUVABLE,
          premiere: CREE,
          justesseAvant: false,
          justesseApres: true,
        });
      };

      const jouerRappels = async (): Promise<void> => {
        const listes = new Map<string, string[]>();
        for (const unPoste of postes) {
          const premier = await poste(
            'get',
            `/sessions/${sessionId}/rappels`,
            unPoste.jeton,
          ).expect(OK);
          const second = await poste(
            'get',
            `/sessions/${sessionId}/rappels`,
            unPoste.jeton,
          ).expect(OK);
          expect(idsDesRappels(second)).toEqual(idsDesRappels(premier));
          expect(idsDesRappels(premier).length).toBeGreaterThanOrEqual(3);
          listes.set(unPoste.nom, idsDesRappels(premier));
        }
        const servis = await banc.contexte.rappels.lister(
          postes[0].participantId,
        );
        expect(servis.map((servi) => servi.questionId)).toEqual(
          listes.get('E1') ?? [],
        );
      };

      const jouerEtayage = async (ecran: Ecran): Promise<void> => {
        if (ecran.brique !== 'fp-worked') {
          return;
        }
        await jouerReponsesLibres(ecran);
        await piloter({
          pilotage: { screenId: ecran.id, etayage: 1 },
        }).expect(SANS_CONTENU);
        const premiereActivite = activitesLibres(cours).get(ecran.id)?.[0];
        if (premiereActivite === undefined) {
          return;
        }
        const apresCorrection = noterConflit(
          await ecrireLibrement(postes[0], {
            screenId: ecran.id,
            activityId: premiereActivite,
            response: 'Apres la correction de l etape.',
          }),
        );
        expect([apresCorrection.status, codeDe(apresCorrection)]).toEqual([
          CONFLIT,
          'PHASE_FERMEE',
        ]);
      };

      const jouerReponsesLibres = async (ecran: Ecran): Promise<void> => {
        const activites = activitesLibres(cours).get(ecran.id) ?? [];
        for (const activite of activites) {
          for (const unPoste of postes.slice(0, 2)) {
            await ecrireLibrement(unPoste, {
              screenId: ecran.id,
              activityId: activite,
              response: `Note de ${unPoste.nom} sur ${activite}.`,
            }).expect(CREE);
          }
        }
      };

      const reponseLibreSur = (ecran: Ecran, texte: string): Test =>
        ecrireLibrement(postes[0], {
          screenId: ecran.id,
          activityId: (activitesLibres(cours).get(ecran.id) ?? ['']).at(-1),
          response: texte,
        });

      const ecrituresDesBriques = (
        auteur: Poste,
        libre: Ecran,
        texte: string,
      ): Record<string, () => Test> => {
        const production = cours.ecrans.find((ecran) =>
          questionsDe(ecran).some(estProduction),
        );
        const coffre = ecranFacultatif('fp-escape');
        const jalon = ecranFacultatif('fp-pulse');
        const defi = ecranFacultatif('fp-challenge');
        return {
          reponseLibre: () =>
            ecrireLibrement(auteur, {
              screenId: libre.id,
              activityId: (activitesLibres(cours).get(libre.id) ?? [''])[0],
              response: texte,
            }),
          ...(production === undefined
            ? {}
            : {
                production: () =>
                  produire(
                    auteur,
                    productionDe(production),
                    productionJuste(productionDe(production)),
                  ),
              }),
          ...(coffre === undefined
            ? {}
            : {
                enigme: () =>
                  poste(
                    'post',
                    `/sessions/${sessionId}/escape/${coffre.proprietes.parcours.id}/tentatives`,
                    auteur.jeton,
                  ).send({
                    enigmeId: coffre.enigmes[0].id,
                    reponse: '1',
                    dureeMs: DUREE_MS,
                  }),
              }),
          ...(jalon === undefined
            ? {}
            : {
                jalon: () =>
                  poste(
                    'put',
                    `/sessions/${sessionId}/pulses/${jalon.proprietes.sondage.id}`,
                    auteur.jeton,
                  ).send({ etat: 'clair' }),
              }),
          ...(defi === undefined
            ? {}
            : {
                defi: () =>
                  poste(
                    'post',
                    `/sessions/${sessionId}/defis/${defi.proprietes.probleme.id}/tentative`,
                    auteur.jeton,
                  ).send({ texte, dureeMs: DUREE_MS }),
              }),
        };
      };

      const conflitsAttendus = (): string[] =>
        [
          'ECRAN_NON_SERVI',
          'PHASE_FERMEE',
          'PHASE_NON_MONOTONE',
          'PRODUCTION_VIDE',
          'SEANCE_COMPLETE',
          'SEANCE_NON_DEMARREE',
          ...(ecranFacultatif('fp-escape') === undefined
            ? []
            : ['ENIGME_VERROUILLEE', 'TENTATIVES_EPUISEES']),
        ].sort(parOrdreAlphabetique);

      const jouerCorrectionSurPlace = async (ecran: Ecran): Promise<void> => {
        const explications = ecran.correctionSurPlace?.explications ?? [];
        const corrigeables = questionsDe(ecran)
          .filter(
            (question) =>
              question.type === 'vote' || question.type === 'numeric',
          )
          .map((question) => question.id);
        for (const devoilees of explications.map((_, rang) => rang + 1)) {
          await piloter({
            pilotage: { screenId: ecran.id, explicationsDevoilees: devoilees },
          }).expect(SANS_CONTENU);
          const toutes =
            ecran.brique !== 'questionnaire' ||
            devoilees === explications.length;
          const references = new Set(
            explications
              .slice(0, devoilees)
              .map((explication) => explication.reference),
          );
          const correction = (await ecranDuSujet(ecran.id))?.correction;

          expect({
            ecran: ecran.id,
            devoilees,
            explications: correction?.explications?.length,
            questions: correction?.questions.map(
              (question) => question.questionId,
            ),
          }).toEqual({
            ecran: ecran.id,
            devoilees,
            explications: toutes ? explications.length : devoilees,
            questions: corrigeables.filter(
              (id) => toutes || references.has(id),
            ),
          });
        }
      };

      const jouerRythmeLibre = async (): Promise<void> => {
        const { intervalleLibre } = attendu;
        const libres = [...activitesLibres(cours).keys()];
        const dedans = cours.ecrans.find(
          (ecran) =>
            libres.includes(ecran.id) &&
            ecran.brique !== 'fp-worked' &&
            cours.ecrans.indexOf(ecran) >= intervalleLibre.premier &&
            cours.ecrans.indexOf(ecran) <= intervalleLibre.dernier,
        );
        const dehors = cours.ecrans.find(
          (ecran) =>
            libres.includes(ecran.id) &&
            cours.ecrans.indexOf(ecran) > intervalleLibre.dernier,
        );
        if (dedans === undefined || dehors === undefined) {
          throw new Error(
            `Le ${PREFIXE} ne permet pas de borner un intervalle libre`,
          );
        }
        await piloter({ mode: 'libre', intervalle: intervalleLibre }).expect(
          SANS_CONTENU,
        );
        const admise = await reponseLibreSur(
          dedans,
          'Dans l intervalle libre.',
        );
        const refusee = noterConflit(
          await reponseLibreSur(dehors, 'Hors de l intervalle libre.'),
        );
        await piloter({
          mode: 'pilote',
          ecran: cours.ecrans.length - 1,
        }).expect(SANS_CONTENU);

        expect({
          admise: admise.status,
          refusee: [refusee.status, codeDe(refusee)],
        }).toEqual({ admise: CREE, refusee: [INTROUVABLE, 'ECRAN_NON_SERVI'] });
      };

      const jouerEcran = async (rang: number, ecran: Ecran): Promise<void> => {
        await piloter({ ecran }).expect(INVALIDE);
        await piloter({ ecran: rang }).expect(SANS_CONTENU);
        briquesJouees.add(ecran.brique);
        switch (ecran.brique) {
          case 'fp-vote':
            await jouerVote(ecran);
            break;
          case 'fp-escape':
            await jouerCoffre(ecran);
            break;
          case 'fp-pulse':
            await jouerJalon(ecran);
            break;
          case 'fp-challenge':
            await jouerDefi(ecran);
            break;
          case 'fp-spaced':
            await jouerRappels();
            break;
          case 'fp-sheet':
            await jouerFeuille(ecran);
            break;
          case 'fp-cardsort':
          case 'fp-table-build':
            await jouerProductions(ecran);
            break;
          case 'fp-worked':
            await jouerEtayage(ecran);
            return;
          default:
            await jouerQuestionsFermees(ecran);
            break;
        }
        if (ecran.brique === 'questionnaire') {
          await signalerUnIncident();
        }
        await jouerReponsesLibres(ecran);
        await jouerCorrectionSurPlace(ecran);
      };

      afterAll(() => {
        for (const flux of [fluxFormateurA, fluxFormateurB, fluxEtudiant]) {
          flux?.fermer();
        }
      });

      installerBancFormationsVierge(
        { secret: SECRET, syntheseA: SYNTHESE_A },
        (monte) => {
          banc = monte;
          bilanEspionne = jest.spyOn(
            banc.app.get(GetSessionResultsUseCase),
            'bilanDe',
          );
        },
      );

      afterAll(() => {
        process.stdout.write(`\nMesures E2E-01\n${mesures.join('\n')}\n`);
      });

      it(
        'sert le cours publie au demarrage et fige sa version a l ouverture de la seance',
        async () => {
          const servi = await catalogueServi<{
            version: number;
            ecrans: EcranPublic[];
          }>();

          const ouverture = await formateur('post', '/sessions')
            .send({ courseSlug: SLUG, capacite: CAPACITE })
            .expect(CREE);
          ({ sessionId, code: codeDeJonction } = ouverture.body as Ouverture);
          const seance = await banc.contexte.sessions.findById(sessionId);
          cours = await coursDuCatalogue(banc, SLUG, VERSION_COURS);

          expect({
            servi: servi.version,
            version: seance?.courseVersion,
            bareme: seance?.bareme.version,
            capacite: seance?.capacite,
            ecrans: cours.ecrans.length,
            titres: servi.ecrans.length,
            piecesJointes: piecesJointesDe(servi.ecrans),
          }).toEqual({
            servi: VERSION_COURS,
            version: VERSION_COURS,
            bareme: VERSION_DU_BAREME,
            capacite: CAPACITE,
            ecrans: ECRANS_DU_COURS,
            titres: ECRANS_DU_COURS,
            piecesJointes: piecesJointesDuCours(
              attendu.piecesJointesAuCatalogue,
            ),
          });
        },
        DELAI_TEST_MS,
      );

      it(
        'accueille quatre postes, refuse le cinquieme et l ecriture avant le depart',
        async () => {
          for (const unPoste of [postes[0], postes[1], postes[2], evince]) {
            await inscrire(unPoste).then((reponse) => {
              expect([unPoste.nom, reponse.status]).toEqual([
                unPoste.nom,
                CREE,
              ]);
            });
          }
          const complete = noterConflit(await inscrire(postes[3]));
          const avantDepart = noterConflit(
            await repondre(postes[0], questionsDe(cours.ecrans[0])[0]),
          );

          expect({
            complete: [complete.status, codeDe(complete)],
            avantDepart: [avantDepart.status, codeDe(avantDepart)],
            graines: new Set(
              [postes[0], postes[1], postes[2], evince].map(
                (unPoste) => unPoste.graine,
              ),
            ).size,
          }).toEqual({
            complete: [CONFLIT, 'SEANCE_COMPLETE'],
            avantDepart: [CONFLIT, 'SEANCE_NON_DEMARREE'],
            graines: CAPACITE,
          });
        },
        DELAI_TEST_MS,
      );

      it(
        'garde chaque ecriture derriere l ecran servi et libere la place de l evince',
        async () => {
          await formateur('post', `/sessions/${sessionId}/start`).expect(
            SANS_CONTENU,
          );
          await piloter({ ecran: 0 }).expect(SANS_CONTENU);
          const rappel = cours.ecrans[0];
          briquesJouees.add(rappel.brique);
          const sujet = await poste(
            'get',
            `/sessions/${sessionId}/sujet`,
            postes[0].jeton,
          ).expect(OK);
          const dues = await poste(
            'get',
            `/sessions/${sessionId}/due-questions`,
            postes[0].jeton,
          ).expect(OK);
          for (const unPoste of [postes[0], postes[1], postes[2], evince]) {
            await repondre(unPoste, questionsDe(rappel)[0]).expect(CREE);
          }

          const exercice = cours.ecrans.find(
            ({ id }) => id === attendu.exerciceEnAvance,
          );
          if (exercice === undefined) {
            throw new Error(`Ecrans du ${PREFIXE} mal identifies`);
          }
          const enAvance = [
            await repondre(postes[1], questionsDe(ecranDe('questionnaire'))[0]),
            ...(ecranFacultatif('fp-spaced') === undefined
              ? []
              : [
                  await poste(
                    'get',
                    `/sessions/${sessionId}/rappels`,
                    postes[1].jeton,
                  ),
                ]),
          ];
          for (const ecrire of Object.values(
            ecrituresDesBriques(postes[1], exercice, 'Trop tot.'),
          )) {
            enAvance.push(await ecrire());
          }
          for (const { ecranId } of classeursReservesDe(cours)) {
            enAvance.push(await pieceJointeAuPoste(ecranId, postes[1].jeton));
          }
          enAvance.forEach(noterConflit);

          await formateur(
            'delete',
            `/sessions/${sessionId}/participants/${evince.participantId}`,
          ).expect(SANS_CONTENU);
          const jetonRevoque = await poste(
            'get',
            `/sessions/${sessionId}/sujet`,
            evince.jeton,
          );
          const ecritureDeLEvince = await repondre(
            evince,
            questionsDe(rappel)[0],
          );
          const lectureDeLEvince = await poste(
            'get',
            `/sessions/${sessionId}/due-questions`,
            evince.jeton,
          );
          const remplacant = await inscrire(postes[3]);
          const reponses = await banc.contexte.answers.listBySession(sessionId);

          expect(
            enAvance.map((reponse) => [reponse.status, codeDe(reponse)]),
          ).toEqual(enAvance.map(() => [INTROUVABLE, 'ECRAN_NON_SERVI']));
          expect({
            jetonRevoque: jetonRevoque.status,
            ecritureDeLEvince: ecritureDeLEvince.status,
            lectureDeLEvince: lectureDeLEvince.status,
            remplacant: remplacant.status,
            graineReprise: postes[3].graine,
            graineLiberee: evince.graine,
            reponsesDeLEvince: reponses.filter(
              (reponse) => reponse.participantId === evince.participantId,
            ).length,
            ecransDuSujet: (sujet.body as { ecrans: unknown[] }).ecrans.length,
            piecesJointesDuSujet: piecesJointesDe(
              (sujet.body as { ecrans: EcranPublic[] }).ecrans,
            ),
            secretsDuSujet: clesSecretesDans(sujet.body),
            questionsDues: Array.isArray(
              (dues.body as { questions: unknown[] }).questions,
            ),
          }).toEqual({
            jetonRevoque: INTROUVABLE,
            ecritureDeLEvince: INTROUVABLE,
            lectureDeLEvince: INTROUVABLE,
            remplacant: CREE,
            graineReprise: evince.graine,
            graineLiberee: evince.graine,
            reponsesDeLEvince: 1,
            ecransDuSujet: ECRANS_DU_COURS,
            piecesJointesDuSujet: piecesJointesDuCours(
              attendu.piecesJointes.filter((id) => id === rappel.id),
            ),
            secretsDuSujet: [],
            questionsDues: true,
          });
        },
        DELAI_TEST_MS,
      );

      it(
        `deroule tous les ecrans et joue chaque brique du ${PREFIXE}`,
        async () => {
          fluxFormateurA = await abonnerAuFlux(
            banc.port,
            chemin(`/sessions/${sessionId}/presenter-stream`),
            { [EN_TETE_IDENTITE]: FORMATEUR },
          );
          fluxFormateurB = await abonnerAuFlux(
            banc.port,
            chemin(`/sessions/${sessionId}/presenter-stream`),
            { [EN_TETE_IDENTITE]: FORMATEUR },
          );
          fluxEtudiant = await abonnerAuFlux(
            banc.port,
            chemin(`/sessions/${sessionId}/stream`),
            { [EN_TETE_JETON]: postes[0].jeton },
          );
          debutDesFlux = Date.now();
          calculsDeBilan = bilanEspionne.mock.calls.length;

          for (const [rang, ecran] of cours.ecrans.entries()) {
            if (rang === 0) {
              continue;
            }
            await jouerEcran(rang, ecran);
          }
          mesures.push(
            `deroule des ${ECRANS_DU_COURS} ecrans : ${((Date.now() - debutDesFlux) / 1000).toFixed(1)} s`,
          );
          await jouerRythmeLibre();
          const sujetDeroule = await poste(
            'get',
            `/sessions/${sessionId}/sujet`,
            postes[0].jeton,
          ).expect(OK);

          const telechargements: [string, boolean, boolean][] = [];
          for (const { ecranId, classeur } of classeursReservesDe(cours)) {
            const octets = octetsDuClasseur(classeur);
            const auPoste = await pieceJointeAuPoste(ecranId, postes[0].jeton)
              .responseType('blob')
              .expect(OK);
            const auPupitre = await formateur(
              'get',
              `/sessions/${sessionId}/deroule/pieces-jointes/${ecranId}`,
            )
              .responseType('blob')
              .expect(OK);
            telechargements.push([
              ecranId,
              octets.equals(auPoste.body as Buffer),
              octets.equals(auPupitre.body as Buffer),
            ]);
          }

          expect(
            piecesJointesDe(
              (sujetDeroule.body as { ecrans: EcranPublic[] }).ecrans,
            ),
          ).toEqual(piecesJointesDuCours(attendu.piecesJointes));
          expect(telechargements).toEqual(
            attendu.classeursReserves.map((ecranId) => [ecranId, true, true]),
          );
          expect([...briquesJouees].sort(parOrdreAlphabetique)).toEqual(
            [...new Set(cours.ecrans.map((ecran) => ecran.brique))].sort(
              parOrdreAlphabetique,
            ),
          );
          expect([...conflitsObserves].sort(parOrdreAlphabetique)).toEqual(
            conflitsAttendus(),
          );
        },
        DELAI_TEST_MS,
      );

      it(
        'pousse un flux resultats complet, au plus une fois par seconde et calcule une fois pour deux flux',
        async () => {
          const resultatsDe = (flux: FluxEcoute): Record<string, unknown>[] =>
            flux.evenements
              .filter((evenement) => evenement.type === 'resultats')
              .map((evenement) => evenement.donnees);
          type BilanPousse = {
            statistiques: unknown;
            jalons: Record<string, unknown>;
            enigmes: unknown[];
            bareme: { questionsNotees: number };
            questions: unknown[];
            participants: number;
          };
          const complet = (bilan: Record<string, unknown>): boolean => {
            const pousse = bilan as BilanPousse;
            return (
              Object.keys(pousse.jalons).length === attendu.jalons &&
              pousse.enigmes.length === attendu.enigmes
            );
          };
          await attendreQue(
            () => resultatsDe(fluxFormateurA).some(complet),
            DELAI_FLUX_MS,
          );
          finDesFlux = Date.now();
          const pousses = resultatsDe(fluxFormateurA);
          const dernier = pousses[pousses.length - 1] as BilanPousse;
          const calculs = bilanEspionne.mock.calls.length - calculsDeBilan;
          const secondes = Math.ceil((finDesFlux - debutDesFlux) / 1000);
          mesures.push(
            `flux resultats : ${pousses.length} poussees sur ${secondes} s, ${calculs} calculs de bilan`,
          );

          expect({
            fluxA: pousses.length > 0,
            fluxB: resultatsDe(fluxFormateurB).length > 0,
            fluxEtudiant: resultatsDe(fluxEtudiant).length,
            statistiques: dernier.statistiques !== undefined,
            jalons: Object.keys(dernier.jalons).length,
            enigmes: dernier.enigmes.length,
            questionsNotees: dernier.bareme.questionsNotees,
            participants: dernier.participants,
          }).toEqual({
            fluxA: true,
            fluxB: true,
            fluxEtudiant: 0,
            statistiques: true,
            jalons: attendu.jalons,
            enigmes: expect.any(Number),
            questionsNotees: attendu.questionsNotees,
            participants: CAPACITE,
          });
          expect(pousses.length).toBeLessThanOrEqual(
            Math.ceil((finDesFlux - debutDesFlux) / DELAI_MIN_BILAN_MS) +
              MARGE_DU_DEBIT,
          );
          expect(calculs).toBeLessThanOrEqual(
            Math.max(pousses.length, resultatsDe(fluxFormateurB).length) +
              MARGE_DU_DEBIT,
          );
        },
        DELAI_TEST_MS,
      );

      it(
        'restitue l etat du participant apres rechargement et refuse une seconde soumission',
        async () => {
          const etatDe = async (unPoste: Poste): Promise<EtatParticipant> =>
            (
              await poste(
                'get',
                `/sessions/${sessionId}/moi`,
                unPoste.jeton,
              ).expect(OK)
            ).body as EtatParticipant;

          const premier = await etatDe(postes[0]);
          const ignorant = await etatDe(postes[2]);
          const question = questionsDe(cours.ecrans[0])[0];
          const seconde = noterConflit(await repondre(postes[0], question));

          expect({
            participant: premier.participantId,
            reponses: premier.reponses.length,
            jalons: premier.jalons.length,
            enigmes: premier.enigmes.length,
            defis: premier.defis.length,
            rappels: premier.rappels.questionIds.length > 0,
            libres: premier.reponsesLibres.length > 0,
            seconde: [seconde.status, codeDe(seconde)],
            cloisonne: ignorant.participantId,
          }).toEqual({
            participant: postes[0].participantId,
            reponses: expect.any(Number),
            jalons: attendu.jalons,
            enigmes: expect.any(Number),
            defis: expect.any(Number),
            rappels: expect.any(Boolean),
            libres: true,
            seconde: [CONFLIT, 'REPONSE_DEJA_ENREGISTREE'],
            cloisonne: postes[2].participantId,
          });
        },
        DELAI_TEST_MS,
      );

      it(
        'tient les annotations et les reponses libres au pupitre',
        async () => {
          const atelier = ecranDe('questionnaire');
          await formateur('post', `/sessions/${sessionId}/annotations`)
            .send({
              screenId: atelier.id,
              note: 'Recopie a revoir sur la colonne des taux.',
            })
            .expect(CREE);
          const annotations = await formateur(
            'get',
            `/sessions/${sessionId}/annotations`,
          ).expect(OK);
          const libres = await formateur(
            'get',
            `/sessions/${sessionId}/free-responses`,
          ).expect(OK);
          const participants = await formateur(
            'get',
            `/sessions/${sessionId}/participants`,
          ).expect(OK);
          const deroule = await formateur(
            'get',
            `/sessions/${sessionId}/deroule`,
          ).expect(OK);
          const resultats = await formateur(
            'get',
            `/sessions/${sessionId}/results`,
          ).expect(OK);
          const maitrise = await formateur(
            'get',
            `/sessions/${sessionId}/rappels/synthese`,
          );
          const rappelEspace = ecranFacultatif('fp-spaced') !== undefined;

          const listeDesParticipants = (
            participants.body as {
              participants: {
                id: string;
                evince: boolean;
              }[];
            }
          ).participants;
          expect({
            annotations: (annotations.body as { annotations: unknown[] })
              .annotations.length,
            libres:
              (libres.body as { responses: unknown[] }).responses.length > 0,
            participantsActifs: listeDesParticipants.filter(
              (inscrit) => !inscrit.evince,
            ).length,
            participantsEvinces: listeDesParticipants
              .filter((inscrit) => inscrit.evince)
              .map((inscrit) => inscrit.id),
            ecransDuDeroule: (deroule.body as { ecrans: unknown[] }).ecrans
              .length,
            questionsAgregees: (
              resultats.body as ResultatsDeSeance
            ).resultats.questions.filter((question) => question.total > 0)
              .length,
            maitrise: [
              maitrise.status,
              rappelEspace &&
                (maitrise.body as { concepts: unknown[] }).concepts.length > 0,
            ],
          }).toEqual({
            annotations: 1,
            libres: true,
            participantsActifs: CAPACITE,
            participantsEvinces: [evince.participantId],
            ecransDuDeroule: ECRANS_DU_COURS,
            questionsAgregees: expect.any(Number),
            maitrise: rappelEspace ? [OK, true] : [INTROUVABLE, false],
          });
        },
        DELAI_TEST_MS,
      );

      it(
        'T4 · accepte le billet de sortie de chaque poste tant que la seance est ouverte',
        async () => {
          const billet = questionsDe(ecranDe('fp-exit'))[0];
          const billets: { nombre: number }[] =
            await banc.contexte.dataSource.query(
              'SELECT COUNT(DISTINCT participant_id)::int AS "nombre" FROM formation_answers WHERE session_id = $1 AND question_id = $2',
              [sessionId, billet.id],
            );

          expect(billets[0].nombre).toBe(CAPACITE);
        },
        DELAI_TEST_MS,
      );

      it(
        'clot la seance, refuse toute ecriture ensuite et rend le rapport etendu',
        async () => {
          await formateur('post', `/sessions/${sessionId}/close`).expect(
            SANS_CONTENU,
          );
          await attendreQue(
            () =>
              fluxEtudiant.evenements.some(
                (evenement) => evenement.type === 'fin',
              ) || fluxEtudiant.ferme,
            DELAI_FLUX_MS,
          );
          const apresCloture = noterConflit(
            await repondre(postes[3], questionsDe(ecranDe('fp-exit'))[0]),
          );
          const rapport = await formateur(
            'get',
            `/sessions/${sessionId}/report`,
          ).expect(OK);
          const bilan = rapport.body as ResultatsDeSeance;
          const scores: { nombre: number }[] =
            await banc.contexte.dataSource.query(
              'SELECT COUNT(*)::int AS "nombre" FROM formation_scores WHERE session_id = $1',
              [sessionId],
            );
          const seance = await banc.contexte.sessions.findById(sessionId);

          expect({
            apresCloture: [apresCloture.status, codeDe(apresCloture)],
            etat: seance?.etat,
            baremeDeLaSeance: seance?.bareme.version,
            participants: bilan.participants.length,
            questionsNotees: bilan.bareme.questionsNotees,
            notation: bilan.notation.typesNotables.length,
            jalons: Object.keys(bilan.jalons).length,
            enigmes: bilan.enigmes.length,
            scores: scores[0].nombre > 0,
            synthese: banc.mailer.sendSyntheseFormateur.mock.calls.length,
            copies: banc.mailer.sendCopieEtudiant.mock.calls.length,
          }).toEqual({
            apresCloture: [CONFLIT, 'SEANCE_TERMINEE'],
            etat: 'terminee',
            baremeDeLaSeance: VERSION_DU_BAREME,
            participants: CAPACITE,
            questionsNotees: attendu.questionsNotees,
            notation: TYPES_NOTABLES,
            jalons: attendu.jalons,
            enigmes: attendu.enigmes,
            scores: true,
            synthese: 1,
            copies: CAPACITE,
          });
          expect(JSON.stringify(bilan)).not.toContain('[object Object]');

          const activitesDuCours = cours.ecrans.flatMap(
            (ecran) => activitesLibres(cours).get(ecran.id) ?? [],
          );
          const ecritesParLesAuteurs = cours.ecrans
            .slice(1)
            .flatMap((ecran) => activitesLibres(cours).get(ecran.id) ?? []);
          const synthese = banc.mailer.sendSyntheseFormateur.mock.calls[0][1];
          expect(
            Object.fromEntries(
              bilan.participants.map((participant) => [
                participant.prenom,
                participant.reponsesLibres
                  .map((libre) => libre.activityId)
                  .filter((activite) => activitesDuCours.includes(activite)),
              ]),
            ),
          ).toEqual({
            'Prenom-E1': ecritesParLesAuteurs,
            'Prenom-E2': ecritesParLesAuteurs,
            'Prenom-E3': [],
            'Prenom-E4': [],
          });
          expect(
            synthese.participants.map(
              (participant) => participant.reponsesLibres,
            ),
          ).toEqual(
            bilan.participants.map((participant) => participant.reponsesLibres),
          );
        },
        DELAI_TEST_MS,
      );

      it(
        'T4 · refuse en 409 SEANCE_TERMINEE chaque ecriture etudiante apres la cloture',
        async () => {
          const auteur = postes[0];
          const libre = cours.ecrans.find(
            (ecran) => (activitesLibres(cours).get(ecran.id) ?? []).length > 0,
          );
          if (libre === undefined) {
            throw new Error(
              `Le ${PREFIXE} publie ne porte aucune reponse libre`,
            );
          }
          const ecritures: Record<string, () => Test> = {
            billet: () => repondre(auteur, questionsDe(ecranDe('fp-exit'))[0]),
            ...ecrituresDesBriques(auteur, libre, 'Apres la cloture.'),
            incidents: () => signaler(auteur),
          };

          const verdicts: Record<string, [number, string | undefined]> = {};
          for (const [nom, ecrire] of Object.entries(ecritures)) {
            const reponse = await ecrire();
            verdicts[nom] = [reponse.status, codeDe(reponse)];
          }

          expect(verdicts).toEqual(
            Object.fromEntries(
              Object.keys(ecritures).map((nom) => [
                nom,
                [CONFLIT, 'SEANCE_TERMINEE'],
              ]),
            ),
          );
        },
        DELAI_TEST_MS,
      );

      it(
        'conserve le cours unique sans toucher a la seance deja ouverte',
        async () => {
          const servi = await catalogueServi<{ version: number }>();
          const suivante = await formateur('post', '/sessions')
            .send({ courseSlug: SLUG })
            .expect(CREE);
          const ouverte = await banc.contexte.sessions.findById(
            (suivante.body as Ouverture).sessionId,
          );
          const jouee = await banc.contexte.sessions.findById(sessionId);

          expect({
            servi: servi.version,
            nouvelle: ouverte?.courseVersion,
            jouee: jouee?.courseVersion,
          }).toEqual({
            servi: VERSION_COURS,
            nouvelle: VERSION_COURS,
            jouee: VERSION_COURS,
          });
        },
        DELAI_TEST_MS,
      );

      it(
        'ne laisse aucune ligne orpheline apres la suppression de la seance',
        async () => {
          const compter = async (table: string): Promise<number> => {
            const [{ nombre }]: { nombre: number }[] =
              await banc.contexte.dataSource.query(
                `SELECT COUNT(*)::int AS "nombre" FROM "${table}"`,
              );
            return nombre;
          };
          const cibles = TABLES_DE_SEANCE.filter(
            (table) => !TABLES_HORS_SEANCE.includes(table),
          );
          const avant = new Map<string, number>();
          for (const table of cibles) {
            avant.set(table, await compter(table));
          }

          await banc.contexte.dataSource.query(
            'DELETE FROM formation_sessions WHERE id IS NOT NULL',
          );

          const apres = new Map<string, number>();
          for (const table of cibles) {
            apres.set(table, await compter(table));
          }
          const maitrise = await compter('formation_mastery');

          expect([...avant].some(([, nombre]) => nombre > 0)).toBe(true);
          expect([...apres]).toEqual(cibles.map((table) => [table, 0]));
          expect(maitrise).toBeGreaterThan(0);
          mesures.push(
            `lignes purgees : ${[...avant]
              .map(([table, nombre]) => `${table}=${String(nombre)}`)
              .join(' ')}`,
          );
        },
        DELAI_TEST_MS,
      );
    },
  );
}

const TRAME_DES_COURS_B2: Pick<
  AttenduDuCours,
  | 'jalons'
  | 'enigmes'
  | 'piecesJointes'
  | 'piecesJointesAuCatalogue'
  | 'classeursReserves'
  | 'intervalleLibre'
> = {
  jalons: 3,
  enigmes: 4,
  piecesJointes: [],
  piecesJointesAuCatalogue: [],
  classeursReserves: [],
  intervalleLibre: { premier: 1, dernier: 20 },
};

seanceComplete(COURS_B2_01, {
  ...TRAME_DES_COURS_B2,
  questionsNotees: 31,
  cellulesDesFeuilles: [17],
  exerciceEnAvance: 'B2-01-A2-06-POINTS',
  jalons: 5,
  intervalleLibre: { premier: 8, dernier: 20 },
});

seanceComplete(COURS_B2_02, {
  ...TRAME_DES_COURS_B2,
  questionsNotees: 16,
  cellulesDesFeuilles: [6],
  exerciceEnAvance: 'B2-02-A2-04-EXEMPLE-NUAGE',
});

seanceComplete(COURS_B2_03, {
  ...TRAME_DES_COURS_B2,
  questionsNotees: 18,
  cellulesDesFeuilles: [5, 10, 34],
  exerciceEnAvance: 'B2-03-A2-04-EXEMPLE-MORGAN',
});

seanceComplete(COURS_B2_04, {
  ...TRAME_DES_COURS_B2,
  questionsNotees: 18,
  cellulesDesFeuilles: [5, 10, 16],
  exerciceEnAvance: 'B2-04-A2-04-EXEMPLE-GEOMETRIQUE',
});

seanceComplete(COURS_B2_05, {
  ...TRAME_DES_COURS_B2,
  questionsNotees: 18,
  cellulesDesFeuilles: [10, 9, 17],
  exerciceEnAvance: 'B2-05-A2-04-EXEMPLE-ANNUITES',
});

seanceComplete(COURS_B2_06, {
  ...TRAME_DES_COURS_B2,
  questionsNotees: 18,
  cellulesDesFeuilles: [13, 12, 10],
  exerciceEnAvance: 'B2-06-A2-04-EXEMPLE-DOUBLEMENT',
});

seanceComplete(COURS_B3_01, {
  questionsNotees: 25,
  cellulesDesFeuilles: [],
  exerciceEnAvance: 'B3-01-A1-12-EXEMPLE-NETTOYAGE',
  jalons: 0,
  enigmes: 0,
  piecesJointes: [
    'B3-01-A1-02-COURRIEL',
    'B3-01-A2-01-VOTE-FAMILLE',
    'B3-01-A3-02-VOTE-GRAPHIQUE',
  ],
  piecesJointesAuCatalogue: ['B3-01-A1-02-COURRIEL'],
  classeursReserves: ['B3-01-A2-01-VOTE-FAMILLE', 'B3-01-A3-02-VOTE-GRAPHIQUE'],
  intervalleLibre: { premier: 1, dernier: 20 },
});
