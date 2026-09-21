/* eslint-disable @typescript-eslint/unbound-method */
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import {
  buildCoursAvecJalon,
  creerCatalogueAVersions,
  creerCatalogueDeTest,
  SONDAGE_DE_TEST,
} from '../../../../../test/factories/cours.factory';
import {
  buildParticipantRecord,
  buildSessionRecord,
  createMockParticipantsRepo,
  createMockPulsesRepo,
  createMockSessionStateCache,
  createMockSessionsRepo,
} from '../../../../../test/factories/formation.factory';
import { cleDeJalon } from '../../domain/cours/CleDeJalon';
import {
  CoursInconnuError,
  EcranNonServiError,
  ParticipantNotFoundError,
  SessionClosedError,
  SessionNotFoundError,
} from '../../domain/errors/FormationErrors';
import { DeclarerJalonUseCase } from '../DeclarerJalon.useCase';

const COURS = buildCoursAvecJalon();
const DERNIER_ECRAN = COURS.ecrans.length - 1;
const SECRET = 'secret-de-test-des-jalons-assez-long-1234';

describe('DeclarerJalonUseCase', () => {
  let sessions: ReturnType<typeof createMockSessionsRepo>;
  let pulses: ReturnType<typeof createMockPulsesRepo>;
  let cache: ReturnType<typeof createMockSessionStateCache>;
  let participants: ReturnType<typeof createMockParticipantsRepo>;
  let sut: DeclarerJalonUseCase;
  let secretInitial: string | undefined;

  const commande = {
    sessionId: 'session-uuid',
    participantId: 'participant-uuid',
    sondageId: SONDAGE_DE_TEST,
    etat: 'ca-va' as const,
  };

  beforeAll(() => {
    secretInitial = process.env.FORMATIONS_PULSE_SECRET;
    process.env.FORMATIONS_PULSE_SECRET = SECRET;
  });

  afterAll(() => {
    process.env.FORMATIONS_PULSE_SECRET = secretInitial;
  });

  beforeEach(() => {
    sessions = createMockSessionsRepo();
    sessions.findById.mockResolvedValue(
      buildSessionRecord({
        courseSlug: COURS.slug,
        ecranCourant: DERNIER_ECRAN,
      }),
    );
    pulses = createMockPulsesRepo();
    cache = createMockSessionStateCache();
    participants = createMockParticipantsRepo();
    sut = new DeclarerJalonUseCase(
      sessions,
      pulses,
      cache,
      creerCatalogueDeTest(COURS),
      participants,
    );
  });

  it('enregistre le jalon sous la cle HMAC du participant', async () => {
    await sut.execute(commande);

    expect(pulses.declarer).toHaveBeenCalledWith({
      sessionId: 'session-uuid',
      cleParticipant: cleDeJalon('session-uuid', 'participant-uuid'),
      sondageId: SONDAGE_DE_TEST,
      etat: 'ca-va',
    });
  });

  it('ne laisse jamais fuiter l identifiant du participant dans la cle', async () => {
    await sut.execute(commande);

    const [envoi] = pulses.declarer.mock.calls[0];
    expect(envoi.cleParticipant).toHaveLength(64);
    expect(envoi.cleParticipant).not.toContain('participant-uuid');
  });

  it('separe les cles de deux seances pour le meme participant', () => {
    expect(cleDeJalon('seance-a', 'participant-uuid')).not.toBe(
      cleDeJalon('seance-b', 'participant-uuid'),
    );
  });

  it('signale l activite de la seance', async () => {
    await sut.execute(commande);

    expect(cache.signalerActivite).toHaveBeenCalledWith('session-uuid');
  });

  it('refuse un sondage absent du cours', async () => {
    await expect(
      sut.execute({ ...commande, sondageId: 'jalon-invente' }),
    ).rejects.toThrow(DomainValidationError);
    expect(pulses.declarer).not.toHaveBeenCalled();
  });

  it('refuse un jalon visant un ecran non projete', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ courseSlug: COURS.slug, ecranCourant: 0 }),
    );

    await expect(sut.execute(commande)).rejects.toThrow(EcranNonServiError);
  });

  it('refuse un jalon apres la cloture', async () => {
    sessions.findById.mockResolvedValue(
      buildSessionRecord({ courseSlug: COURS.slug, etat: 'terminee' }),
    );

    await expect(sut.execute(commande)).rejects.toThrow(SessionClosedError);
  });

  it('signale une seance introuvable', async () => {
    sessions.findById.mockResolvedValue(null);

    await expect(sut.execute(commande)).rejects.toThrow(SessionNotFoundError);
  });

  it('signale un cours introuvable', async () => {
    sut = new DeclarerJalonUseCase(
      sessions,
      pulses,
      cache,
      creerCatalogueAVersions({}),
      participants,
    );

    await expect(sut.execute(commande)).rejects.toThrow(CoursInconnuError);
  });

  it('refuse de signer sans secret de jalon configure', () => {
    const secret = process.env.FORMATIONS_PULSE_SECRET;
    process.env.FORMATIONS_PULSE_SECRET = 'trop-court';

    expect(() => cleDeJalon('session-uuid', 'participant-uuid')).toThrow(
      /FORMATIONS_PULSE_SECRET/,
    );

    process.env.FORMATIONS_PULSE_SECRET = secret;
  });

  it('refuse le jalon d un participant evince', async () => {
    participants.findById.mockResolvedValue(
      buildParticipantRecord({
        evinceLe: new Date('2026-09-20T09:00:00.000Z'),
      }),
    );

    await expect(sut.execute(commande)).rejects.toThrow(
      ParticipantNotFoundError,
    );
    expect(pulses.declarer).not.toHaveBeenCalled();
  });
});
