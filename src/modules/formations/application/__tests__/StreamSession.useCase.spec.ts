/* eslint-disable @typescript-eslint/unbound-method */
import { Logger } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { firstValueFrom, take, toArray } from 'rxjs';
import type { Observable, Subscription } from 'rxjs';
import { creerCatalogueDeTest } from '../../../../../test/factories/cours.factory';
import {
  buildAnswerRecord,
  buildBareme,
  buildParticipantRecord,
  buildSessionRecord,
  createMockAnswersRepo,
  buildResultatQuestion,
  createMockEscapeRepo,
  createMockIncidentsRepo,
  createMockPulsesRepo,
  createMockParticipantsRepo,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import {
  PlafondDeFluxAtteintError,
  SessionNotOwnedError,
  SessionStreamLimitError,
} from '../../domain/errors/FormationErrors';
import type { AnswerRecord } from '../../domain/IAnswers.repository';
import type {
  IStreamCapacity,
  StreamCapacityLease,
  StreamCapacityRequest,
} from '../../domain/IStreamCapacity.port';
import type { ResultatsSeance } from '../../domain/ResultatsSeance';
import { SessionStateCacheService } from '../../infrastructure/SessionStateCache.service';
import { GetSessionResultsUseCase } from '../GetSessionResults.useCase';
import {
  CADENCES_PRODUCTION,
  DELAI_MIN_BILAN_MS,
  MAX_ABONNEMENTS_PAR_SESSION,
  MAX_FLUX_FORMATEUR_PAR_SESSION,
  MAX_FLUX_PAR_PARTICIPANT,
  StreamSessionUseCase,
} from '../StreamSession.useCase';

const CINQ_HEURES_MS = 5 * 60 * 60 * 1000;
const HEARTBEAT_MS_TEST = 15000;
const INTERVALLE_MS_TEST = 500;
const SESSION = 'session-uuid';
const TEACHER_ID = 'teacher-uuid';
const PARTICIPANT_ID = 'participant-uuid';

function participantDeRang(rang: number): string {
  return `etudiant-${rang}`;
}

const REPONSE_FAUSSE = buildAnswerRecord({
  id: 'answer-fausse-uuid',
  participantId: 'participant-2-uuid',
  valeur: 1300,
  correcte: false,
  misconception: 'interet-simple',
});

interface Ecoute {
  readonly abonnement: Subscription;
  readonly evenements: MessageEvent[];
  resultats(): ResultatsSeance[];
  types(): string[];
  terminee(): boolean;
}

function ecouter(flux: Observable<MessageEvent>): Ecoute {
  const evenements: MessageEvent[] = [];
  let terminee = false;
  return {
    abonnement: flux.subscribe({
      next: (evenement) => evenements.push(evenement),
      complete: () => {
        terminee = true;
      },
    }),
    evenements,
    resultats: () =>
      evenements
        .filter((evenement) => evenement.type === 'resultats')
        .map((evenement) => evenement.data as ResultatsSeance),
    types: () => evenements.map((evenement) => String(evenement.type)),
    terminee: () => terminee,
  };
}

function fermer(ouverts: readonly Ecoute[]): void {
  ouverts.forEach((ecoute) => ecoute.abonnement.unsubscribe());
}

function laisserPasser(ms = 10): Promise<void> {
  return jest.advanceTimersByTimeAsync(ms);
}

function erreurDuFlux(flux: Observable<MessageEvent>): Promise<unknown> {
  return new Promise<unknown>((resolve) => {
    flux.subscribe({ error: resolve });
  });
}

function capacitePartagee(): IStreamCapacity {
  const occupants = new Map<string, Map<string, number>>();
  let sequence = 0;
  return {
    acquire: (request: StreamCapacityRequest): Promise<StreamCapacityLease> => {
      if (
        request.places.some(({ key, limit }) => {
          const compte = occupants.get(key)?.size ?? 0;
          return compte >= limit;
        })
      ) {
        throw new PlafondDeFluxAtteintError(
          request.places.map(({ key }) => key).join(', '),
        );
      }
      const token = `bail-${sequence++}`;
      for (const { key } of request.places) {
        const places = occupants.get(key) ?? new Map<string, number>();
        places.set(token, 1);
        occupants.set(key, places);
      }
      return Promise.resolve({
        token,
        keys: request.places.map(({ key }) => key),
      });
    },
    refresh: () => Promise.resolve(),
    release: (lease: StreamCapacityLease) => {
      for (const key of lease.keys) {
        const places = occupants.get(key);
        places?.delete(lease.token);
        if (places?.size === 0) occupants.delete(key);
      }
      return Promise.resolve();
    },
  };
}

describe('StreamSessionUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let cache: SessionStateCacheService;
  let answers: ReturnType<typeof createMockAnswersRepo>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let resultats: GetSessionResultsUseCase;
  let sut: StreamSessionUseCase;

  const instanceNeuve = (capacite?: IStreamCapacity): StreamSessionUseCase =>
    new StreamSessionUseCase(
      sessions,
      new SessionStateCacheService(),
      resultats,
      participants,
      undefined,
      capacite,
    );
  const fluxEtudiant = (participantId = PARTICIPANT_ID, flux = sut) =>
    flux.execute(SESSION, participantId, 0);
  const ecouterEtudiant = (
    participantId?: string,
    flux?: StreamSessionUseCase,
  ) => ecouter(fluxEtudiant(participantId, flux));
  const ecouterFormateur = async (flux = sut): Promise<Ecoute> =>
    ecouter(await flux.executeForTeacher(SESSION, TEACHER_ID));
  const tousLesMessages = (flux: Observable<MessageEvent>) =>
    firstValueFrom(flux.pipe(toArray()));
  const seanceLue = (surcharges: Parameters<typeof buildSessionRecord>[0]) =>
    sessions.findById.mockResolvedValue(buildSessionRecord(surcharges));
  const participantAuDelaDuPlafond =
    (flux = sut, sessionId = SESSION) =>
    () =>
      flux.execute(
        sessionId,
        participantDeRang(MAX_ABONNEMENTS_PAR_SESSION),
        0,
      );

  beforeEach(() => {
    jest.useFakeTimers();
    sessions = createMockSessionsRepo();
    cache = new SessionStateCacheService();
    answers = createMockAnswersRepo();
    participants = createMockParticipantsRepo();
    resultats = new GetSessionResultsUseCase(
      sessions,
      participants,
      answers,
      createMockIncidentsRepo(),
      creerCatalogueDeTest(),
      createMockPulsesRepo(),
      createMockEscapeRepo(),
    );
    sut = new StreamSessionUseCase(sessions, cache, resultats, participants);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('emet l etat initial des la souscription', async () => {
    const premier = firstValueFrom(fluxEtudiant());
    await laisserPasser();
    const message = await premier;
    expect(message.type).toBe('etat');
  });

  it.each([
    [
      'du participant evince',
      { evinceLe: new Date('2026-09-20T09:00:00.000Z') },
      'evince',
    ],
    [
      'S1 · ouvert avec un jeton que la liberation du poste a revoque',
      { generationDeJeton: 1 },
      'revoque',
    ],
    [
      'S1 · dont le jeton, revoque, ne reviendra pas avec une readmission',
      {
        generationDeJeton: 1,
        evinceLe: new Date('2026-09-20T09:00:00.000Z'),
      },
      'revoque',
    ],
  ])(
    'ferme pendant qu il est ouvert le flux %s',
    async (_cas, exclusion, raison) => {
      const ecoute = ecouterEtudiant();
      await laisserPasser(INTERVALLE_MS_TEST);
      const avantEviction = ecoute.terminee();

      participants.findById.mockResolvedValue(
        buildParticipantRecord(exclusion),
      );
      await laisserPasser(INTERVALLE_MS_TEST * 8);

      expect({
        avantEviction,
        apresEviction: ecoute.terminee(),
        derniereRaison: (
          ecoute.evenements[ecoute.evenements.length - 1].data as {
            raison?: string;
          }
        ).raison,
      }).toEqual({
        avantEviction: false,
        apresEviction: true,
        derniereRaison: raison,
      });
      fermer([ecoute]);
    },
  );

  describe('deduplication des etats', () => {
    const deuxPremiers = () =>
      firstValueFrom(fluxEtudiant().pipe(take(2), toArray()));

    it('n emet pas deux fois le meme etat', async () => {
      const messages = deuxPremiers();
      await laisserPasser(HEARTBEAT_MS_TEST);
      const recus = await messages;
      expect(recus[1].type).toBe('heartbeat');
    });

    it('emet un nouvel etat quand l ecran change', async () => {
      const messages = deuxPremiers();
      await laisserPasser(100);
      seanceLue({ ecranCourant: 9 });
      cache.drop(SESSION);
      await laisserPasser(HEARTBEAT_MS_TEST);
      const recus = await messages;
      expect(recus[1].type).toBe('etat');
      expect((recus[1].data as Record<string, unknown>)['ecranCourant']).toBe(
        9,
      );
    });
  });

  it.each([
    ['terminee', () => seanceLue({ etat: 'terminee' }), 1000],
    ['introuvable', () => sessions.findById.mockResolvedValue(null), 10],
  ])(
    'termine le flux quand la session est %s',
    async (_etat, preparer, attenteMs) => {
      preparer();
      const messages = tousLesMessages(fluxEtudiant());
      await laisserPasser(attenteMs);
      const recus = await messages;
      expect(recus[recus.length - 1].type).toBe('fin');
    },
  );

  it('laisse le cache d etat a la cloture de la seance, qui le vide une seule fois', async () => {
    seanceLue({ etat: 'terminee' });
    const abonnements = Array.from({ length: 3 }, (_, rang) =>
      fluxEtudiant(`${PARTICIPANT_ID}-${rang}`).subscribe(),
    );
    await laisserPasser();

    expect(cache.read(SESSION)).not.toBeNull();
    for (const abonnement of abonnements) {
      abonnement.unsubscribe();
    }
  });

  it('ne vide pas le cache quand un client se desabonne d une session active', async () => {
    const subscription = fluxEtudiant().subscribe();
    await laisserPasser();
    expect(cache.read(SESSION)).not.toBeNull();
    subscription.unsubscribe();
    expect(cache.read(SESSION)).not.toBeNull();
  });

  describe('plafond partage indisponible (H6, AC-39)', () => {
    const capaciteQuiRefuse = (motif: Error): IStreamCapacity => ({
      acquire: () => Promise.reject(motif),
      refresh: () => Promise.resolve(),
      release: () => Promise.resolve(),
    });
    const capaciteEnPanne = () =>
      capaciteQuiRefuse(new Error('Redis indisponible'));

    it('refuse le flux en 429 et journalise un avertissement quand le plafond est atteint', async () => {
      const avertir = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
      const erreur = erreurDuFlux(
        fluxEtudiant(
          PARTICIPANT_ID,
          instanceNeuve(
            capaciteQuiRefuse(
              new PlafondDeFluxAtteintError('session:session-uuid'),
            ),
          ),
        ),
      );
      await laisserPasser();

      await expect(erreur).resolves.toBeInstanceOf(SessionStreamLimitError);
      expect(avertir).toHaveBeenCalledWith(
        expect.stringContaining('Plafond de flux atteint'),
      );
      avertir.mockRestore();
    });

    it('ouvre le flux en mode degrade et journalise une erreur quand Redis tombe', async () => {
      const signaler = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      const flux = ecouterEtudiant(
        PARTICIPANT_ID,
        instanceNeuve(capaciteEnPanne()),
      );
      await laisserPasser();

      expect(flux.types()).toContain('etat');
      expect(signaler).toHaveBeenCalledWith(
        expect.stringContaining('mode degrade'),
        expect.stringContaining('Redis indisponible'),
      );
      fermer([flux]);
      signaler.mockRestore();
    });

    it('borne le mode degrade par les plafonds du processus', async () => {
      const degrade = instanceNeuve(capaciteEnPanne());
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
      const ouverts = Array.from(
        { length: MAX_ABONNEMENTS_PAR_SESSION },
        (_, rang) => ecouterEtudiant(participantDeRang(rang), degrade),
      );
      await laisserPasser();

      expect(participantAuDelaDuPlafond(degrade)).toThrow(
        SessionStreamLimitError,
      );
      fermer(ouverts);
      jest.restoreAllMocks();
    });
  });

  describe('budgets de flux simultanes', () => {
    const ouvrirFluxEtudiants = async (
      nombre: number,
      sessionId = SESSION,
    ): Promise<Ecoute[]> => {
      const ouverts = Array.from({ length: nombre }, (_, rang) =>
        ecouter(sut.execute(sessionId, participantDeRang(rang), 0)),
      );
      await laisserPasser();
      return ouverts;
    };

    const ouvrirFluxDuParticipant = async (
      nombre: number,
    ): Promise<Ecoute[]> => {
      const ouverts = Array.from({ length: nombre }, () => ecouterEtudiant());
      await laisserPasser();
      return ouverts;
    };

    const ouvrirFluxFormateur = async (nombre: number): Promise<Ecoute[]> => {
      const ouverts = await Promise.all(
        Array.from({ length: nombre }, () => ecouterFormateur()),
      );
      await laisserPasser();
      return ouverts;
    };

    const ouvrirUnDePlus = async (
      ouvrir: () => Ecoute | Promise<Ecoute>,
    ): Promise<Ecoute> => {
      const nouveau = await ouvrir();
      await laisserPasser();
      return nouveau;
    };

    const terminees = (ouverts: readonly Ecoute[]): boolean[] =>
      ouverts.map((ecoute) => ecoute.terminee());

    const seulLePremierTermine = (nombre: number): boolean[] =>
      Array.from({ length: nombre }, (_, rang) => rang === 0);

    const TITULAIRES = [
      {
        titulaire: 'du formateur',
        plafond: MAX_FLUX_FORMATEUR_PAR_SESSION,
        ouvrir: ouvrirFluxFormateur,
        ouvrirUn: () => ecouterFormateur(),
      },
      {
        titulaire: 'd un participant',
        plafond: MAX_FLUX_PAR_PARTICIPANT,
        ouvrir: ouvrirFluxDuParticipant,
        ouvrirUn: () => ecouterEtudiant(),
      },
    ];

    it('borne le nombre de flux etudiants simultanes sur une meme session', async () => {
      const ouverts = await ouvrirFluxEtudiants(MAX_ABONNEMENTS_PAR_SESSION);

      expect(participantAuDelaDuPlafond()).toThrow(SessionStreamLimitError);

      fermer(ouverts);
    });

    it('ne compte pas deux sessions distinctes dans le meme plafond', async () => {
      const ouverts = await ouvrirFluxEtudiants(MAX_ABONNEMENTS_PAR_SESSION);

      expect(participantAuDelaDuPlafond(sut, 'autre-session')).not.toThrow();

      fermer(ouverts);
    });

    it('rend sa place au plafond quand un client se desabonne', async () => {
      const ouverts = await ouvrirFluxEtudiants(MAX_ABONNEMENTS_PAR_SESSION);
      ouverts[0].abonnement.unsubscribe();

      expect(participantAuDelaDuPlafond()).not.toThrow();

      fermer(ouverts.slice(1));
    });

    it('ouvre le flux du formateur quand cent flux etudiants tiennent deja la session', async () => {
      const ouverts = await ouvrirFluxEtudiants(MAX_ABONNEMENTS_PAR_SESSION);

      const ecoute = await ouvrirUnDePlus(() => ecouterFormateur());

      expect(ecoute.types()).toContain('etat');
      fermer([ecoute, ...ouverts]);
    });

    it('reserve au formateur des places que ses flux ne prennent pas aux etudiants', async () => {
      const formateur = await ouvrirFluxFormateur(
        MAX_FLUX_FORMATEUR_PAR_SESSION,
      );

      const etudiants = await ouvrirFluxEtudiants(MAX_ABONNEMENTS_PAR_SESSION);

      expect(terminees(formateur)).not.toContain(true);
      expect(terminees(etudiants)).not.toContain(true);
      fermer([...formateur, ...etudiants]);
    });

    it.each(TITULAIRES)(
      'clot sans evenement fin le plus ancien flux $titulaire qui en ouvre un au-dela de son plafond',
      async ({ plafond, ouvrir, ouvrirUn }) => {
        const siens = await ouvrir(plafond);

        const nouveau = await ouvrirUnDePlus(ouvrirUn);

        expect(terminees(siens)).toEqual(seulLePremierTermine(plafond));
        expect(siens[0].types()).not.toContain('fin');
        expect(nouveau.types()).toContain('etat');
        expect(nouveau.terminee()).toBe(false);
        fermer([...siens, nouveau]);
      },
    );

    it.each(TITULAIRES)(
      'rend sa place $titulaire quand l un de ses flux se ferme',
      async ({ plafond, ouvrir, ouvrirUn }) => {
        const siens = await ouvrir(plafond);
        siens[0].abonnement.unsubscribe();

        const nouveau = await ouvrirUnDePlus(ouvrirUn);

        expect(terminees(siens.slice(1))).not.toContain(true);
        fermer([...siens, nouveau]);
      },
    );

    it('ne laisse aucune place au participant ni a la seance apres un remplacement puis la fermeture de ses flux', async () => {
      fermer(await ouvrirFluxDuParticipant(MAX_FLUX_PAR_PARTICIPANT + 1));
      expect(jest.getTimerCount()).toBe(0);

      const siens = await ouvrirFluxDuParticipant(MAX_FLUX_PAR_PARTICIPANT);
      const autres = await ouvrirFluxEtudiants(
        MAX_ABONNEMENTS_PAR_SESSION - MAX_FLUX_PAR_PARTICIPANT,
      );

      expect(terminees(siens)).not.toContain(true);
      expect(participantAuDelaDuPlafond()).toThrow(SessionStreamLimitError);
      fermer([...siens, ...autres]);
    });

    it('ne laisse aucune place au formateur apres un remplacement puis la fermeture de ses flux', async () => {
      fermer(await ouvrirFluxFormateur(MAX_FLUX_FORMATEUR_PAR_SESSION + 1));
      expect(jest.getTimerCount()).toBe(0);

      const formateur = await ouvrirFluxFormateur(
        MAX_FLUX_FORMATEUR_PAR_SESSION,
      );
      expect(terminees(formateur)).not.toContain(true);

      const nouveau = await ouvrirUnDePlus(() => ecouterFormateur());

      expect(terminees(formateur)).toEqual(
        seulLePremierTermine(MAX_FLUX_FORMATEUR_PAR_SESSION),
      );
      fermer([...formateur, nouveau]);
    });

    it('remplace le plus ancien flux d un participant a son plafond meme quand la seance est pleine, sans ouvrir la seance a un nouveau participant', async () => {
      const siens = await ouvrirFluxDuParticipant(MAX_FLUX_PAR_PARTICIPANT);
      const autres = await ouvrirFluxEtudiants(
        MAX_ABONNEMENTS_PAR_SESSION - MAX_FLUX_PAR_PARTICIPANT,
      );

      const nouveau = await ouvrirUnDePlus(() => ecouterEtudiant());

      expect(terminees(siens)).toEqual(
        seulLePremierTermine(MAX_FLUX_PAR_PARTICIPANT),
      );
      expect(nouveau.types()).toContain('etat');
      expect(participantAuDelaDuPlafond()).toThrow(SessionStreamLimitError);
      fermer([...siens, ...autres, nouveau]);
    });

    it('applique le plafond de session entre deux instances', async () => {
      const capacite = capacitePartagee();
      const instances = [instanceNeuve(capacite), instanceNeuve(capacite)];
      const moitie = MAX_ABONNEMENTS_PAR_SESSION / 2;
      const ouverts = instances.flatMap((instance, numero) =>
        Array.from({ length: moitie }, (_, rang) =>
          ecouterEtudiant(participantDeRang(numero * moitie + rang), instance),
        ),
      );
      await laisserPasser();

      const erreur = erreurDuFlux(
        fluxEtudiant('participant-au-dela-du-plafond', instances[1]),
      );
      await expect(erreur).resolves.toBeInstanceOf(SessionStreamLimitError);
      fermer(ouverts);
    });
  });

  it('ouvre le flux au formateur proprietaire de la session', async () => {
    seanceLue({ teacherId: TEACHER_ID });

    const flux = await sut.executeForTeacher(SESSION, TEACHER_ID);
    const premier = firstValueFrom(flux);
    await laisserPasser();

    expect((await premier).type).toBe('etat');
  });

  it('refuse le flux a un formateur qui n est pas celui de la session', async () => {
    seanceLue({ teacherId: TEACHER_ID });

    await expect(
      sut.executeForTeacher(SESSION, 'autre-teacher-uuid'),
    ).rejects.toThrow(SessionNotOwnedError);
  });

  it('tient le flux jusqu a sa duree maximale puis le termine avec la raison expiree', async () => {
    const dureeMaxMs = 60_000;
    const brefs = new StreamSessionUseCase(
      sessions,
      cache,
      resultats,
      participants,
      { battementMs: HEARTBEAT_MS_TEST, dureeMaxMs },
    );
    const ecoute = ecouterEtudiant(PARTICIPANT_ID, brefs);

    await laisserPasser(dureeMaxMs - 1000);
    expect(ecoute.terminee()).toBe(false);

    await laisserPasser(2000);
    expect(ecoute.terminee()).toBe(true);
    const dernier = ecoute.evenements[ecoute.evenements.length - 1];
    expect(dernier.type).toBe('fin');
    expect((dernier.data as Record<string, unknown>)['raison']).toBe('expiree');

    fermer([ecoute]);
  });

  it('tient cinq heures en production, avec un battement toutes les quinze secondes', () => {
    expect(CADENCES_PRODUCTION.dureeMaxMs).toBe(CINQ_HEURES_MS);
    expect(CADENCES_PRODUCTION.battementMs).toBe(15_000);
  });

  describe('resultats agreges', () => {
    const formateurALEcoute = async (): Promise<Ecoute> => {
      const ecoute = await ecouterFormateur();
      await laisserPasser();
      return ecoute;
    };
    const deuxReponsesDontUneFausse = () =>
      answers.listBySession.mockResolvedValue([
        buildAnswerRecord(),
        REPONSE_FAUSSE,
      ]);

    it('emet les jalons, les enigmes et le bareme avec chaque poussee de resultats', async () => {
      const ecoute = await formateurALEcoute();

      const [pousses] = ecoute.resultats();
      expect(Object.keys(pousses as object)).toEqual(
        expect.arrayContaining(['jalons', 'enigmes', 'bareme']),
      );
      fermer([ecoute]);
    });

    it('pousse au formateur les resultats et les statistiques du depot des le premier passage', async () => {
      const ecoute = await formateurALEcoute();

      expect(ecoute.types()).toEqual(['etat', 'resultats']);
      expect(ecoute.resultats()).toEqual([
        {
          participants: 1,
          questions: [
            buildResultatQuestion({
              questionId: 'Q-CAP-03',
              ecranId: '',
              total: 1,
              correctes: 1,
            }),
          ],
          statistiques: {
            moyenne: 20,
            mediane: 20,
            dispersion: 0,
            tauxParticipation: 1,
            tauxReussite: 1,
            questionsProblemes: [],
          },
          jalons: {},
          enigmes: [],
          bareme: {
            questionsNotees: 1,
            parType: {
              numeric: { notees: 1, nonNotees: 0 },
              vote: { notees: 0, nonNotees: 0 },
              feuille: { notees: 0, nonNotees: 0 },
              tableau: { notees: 0, nonNotees: 0 },
              classement: { notees: 0, nonNotees: 0 },
              enigme: { notees: 0, nonNotees: 0 },
            },
          },
        },
      ]);
      expect(answers.listBySession).toHaveBeenCalledWith(SESSION);
      expect(participants.listBySession).toHaveBeenCalledWith(SESSION);
      fermer([ecoute]);
    });

    it('ne recalcule pas les resultats sans activite nouvelle', async () => {
      const ecoute = await ecouterFormateur();
      await laisserPasser(10 * INTERVALLE_MS_TEST);

      expect(ecoute.resultats()).toHaveLength(1);
      expect(answers.listBySession).toHaveBeenCalledTimes(1);
      fermer([ecoute]);
    });

    it('repousse les resultats recalcules apres une activite signalee', async () => {
      const ecoute = await formateurALEcoute();
      deuxReponsesDontUneFausse();

      cache.signalerActivite(SESSION);
      await laisserPasser(DELAI_MIN_BILAN_MS);

      expect(ecoute.resultats()).toHaveLength(2);
      expect(ecoute.resultats()[1].questions[0]).toMatchObject({
        total: 2,
        correctes: 1,
      });
      fermer([ecoute]);
    });

    it('ne calcule qu un bilan pour les deux flux du formateur', async () => {
      const premier = await ecouterFormateur();
      const second = await ecouterFormateur();
      await laisserPasser();

      expect(premier.resultats()).toHaveLength(1);
      expect(second.resultats()).toHaveLength(1);
      expect(second.resultats()[0]).toBe(premier.resultats()[0]);
      expect(answers.listBySession).toHaveBeenCalledTimes(1);
      fermer([premier, second]);
    });

    it('ne recalcule pas le bilan plus d une fois par seconde malgre l activite', async () => {
      const ecoute = await formateurALEcoute();

      cache.signalerActivite(SESSION);
      await laisserPasser(INTERVALLE_MS_TEST);
      expect(answers.listBySession).toHaveBeenCalledTimes(1);
      expect(ecoute.resultats()).toHaveLength(1);

      await laisserPasser(INTERVALLE_MS_TEST);
      expect(answers.listBySession).toHaveBeenCalledTimes(2);
      expect(ecoute.resultats()).toHaveLength(2);
      fermer([ecoute]);
    });

    it('pousse le bilan definitif d une seance terminee sans attendre la seconde', async () => {
      const ecoute = await formateurALEcoute();

      seanceLue({ etat: 'terminee' });
      cache.drop(SESSION);
      cache.signalerActivite(SESSION);
      await laisserPasser(INTERVALLE_MS_TEST);

      expect(ecoute.resultats()).toHaveLength(2);
      expect(ecoute.types()).toContain('fin');
      fermer([ecoute]);
    });

    it('n emet jamais les resultats sur le flux etudiant, meme apres une activite', async () => {
      const ecoute = ecouterEtudiant();
      await laisserPasser();

      cache.signalerActivite(SESSION);
      await laisserPasser(4 * INTERVALLE_MS_TEST);

      expect(ecoute.resultats()).toEqual([]);
      expect(answers.listBySession).not.toHaveBeenCalled();
      fermer([ecoute]);
    });

    it('recalcule depuis le depot les resultats d une nouvelle instance au cache neuf', async () => {
      cache.signalerActivite(SESSION);
      cache.signalerActivite(SESSION);
      deuxReponsesDontUneFausse();
      participants.listBySession.mockResolvedValue([
        buildParticipantRecord(),
        buildParticipantRecord({ id: 'participant-2-uuid', seed: 1002 }),
      ]);

      const ecoute = await ecouterFormateur(instanceNeuve());
      await laisserPasser();

      expect(ecoute.resultats()).toHaveLength(1);
      expect(ecoute.resultats()[0]).toMatchObject({
        participants: 2,
        questions: [
          {
            total: 2,
            correctes: 1,
            confusions: [{ id: 'interet-simple', nombre: 1 }],
          },
        ],
      });
      fermer([ecoute]);
    });

    it('agrege avec le bareme de la session lue au controle de propriete', async () => {
      const bareme = buildBareme();
      sessions.findById.mockResolvedValueOnce(
        buildSessionRecord({
          bareme: buildBareme({
            questions: [
              ...bareme.questions,
              { ...bareme.questions[0], id: 'Q-CAP-04' },
            ],
          }),
        }),
      );

      const ecoute = await formateurALEcoute();

      expect(
        ecoute.resultats()[0].questions.map((question) => question.questionId),
      ).toEqual(['Q-CAP-03', 'Q-CAP-04']);
      fermer([ecoute]);
    });

    it('ne superpose pas deux recalculs quand le depot tarde a repondre', async () => {
      answers.listBySession.mockReturnValueOnce(
        new Promise<readonly AnswerRecord[]>((resoudre) => {
          setTimeout(() => resoudre([]), 10 * INTERVALLE_MS_TEST);
        }),
      );
      const ecoute = await formateurALEcoute();

      cache.signalerActivite(SESSION);
      await laisserPasser(6 * INTERVALLE_MS_TEST);

      expect(answers.listBySession).toHaveBeenCalledTimes(1);
      fermer([ecoute]);
    });

    it('pousse les resultats definitifs avant de clore le flux d une seance terminee', async () => {
      seanceLue({ etat: 'terminee' });

      const messages = tousLesMessages(
        await sut.executeForTeacher(SESSION, TEACHER_ID),
      );
      await laisserPasser();

      expect((await messages).map((message) => message.type)).toEqual([
        'etat',
        'resultats',
        'fin',
      ]);
    });
  });

  describe('panne passagere de la base', () => {
    const PANNE = new Error('connexion au serveur perdue');
    let avertissement: jest.SpyInstance;

    beforeEach(() => {
      avertissement = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);
    });

    afterEach(() => {
      avertissement.mockRestore();
    });

    const apresDeuxPassages = async (
      ouvrir: () => Ecoute | Promise<Ecoute>,
    ): Promise<Ecoute> => {
      const ecoute = await ouvrir();
      await laisserPasser();
      await laisserPasser(INTERVALLE_MS_TEST);
      return ecoute;
    };

    const expectPanneJournalisee = (): void => {
      expect(avertissement).toHaveBeenCalledTimes(1);
      expect(avertissement).toHaveBeenCalledWith(
        expect.stringContaining(SESSION),
      );
      expect(avertissement).toHaveBeenCalledWith(
        expect.stringContaining(PANNE.message),
      );
    };

    it('garde le flux etudiant ouvert et emet l etat au passage suivant', async () => {
      sessions.findById.mockRejectedValueOnce(PANNE);

      const ecoute = await apresDeuxPassages(() => ecouterEtudiant());

      expectPanneJournalisee();
      expect(ecoute.types()).toEqual(['etat']);
      fermer([ecoute]);
    });

    it('garde le flux formateur ouvert et pousse les resultats au passage suivant', async () => {
      answers.listBySession.mockRejectedValueOnce(PANNE);

      const ecoute = await apresDeuxPassages(() => ecouterFormateur());

      expectPanneJournalisee();
      expect(ecoute.types()).toEqual(['etat', 'resultats']);
      fermer([ecoute]);
    });

    it('clot le flux formateur d une seance terminee quand la lecture des resultats reste en echec, sur un seul avertissement', async () => {
      seanceLue({ etat: 'terminee' });
      answers.listBySession.mockRejectedValue(PANNE);

      const ecoute = await ecouterFormateur();
      await laisserPasser(10 * INTERVALLE_MS_TEST);

      expect(ecoute.types()).toEqual(['etat', 'fin']);
      expectPanneJournalisee();
      fermer([ecoute]);
    });
  });
});
