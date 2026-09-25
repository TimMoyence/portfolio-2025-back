/* eslint-disable @typescript-eslint/unbound-method */
import { DomainValidationError } from '../../../../common/domain/errors/DomainValidationError';
import {
  buildCoursAvecJalon,
  creerCatalogueAVersions,
  creerParticipationEnSeance,
  monterParticipationSurLeDernierEcran,
  SONDAGE_DE_TEST,
} from '../../../../../test/factories/cours.factory';
import { createMockPulsesRepo } from '../../../../../test/factories/formation.factory';
import { installerSecretDeJalons } from '../../../../../test/helpers/env-formations';
import { verifierContratDeParticipation } from '../../../../../test/helpers/gardes-de-seance';
import { cleDeJalon } from '../../domain/cours/CleDeJalon';
import { CoursInconnuError } from '../../domain/errors/FormationErrors';
import { DeclarerJalonUseCase } from '../DeclarerJalon.useCase';

const COURS = buildCoursAvecJalon();

describe('DeclarerJalonUseCase', () => {
  let depots: ReturnType<typeof monterParticipationSurLeDernierEcran>;
  let pulses: ReturnType<typeof createMockPulsesRepo>;
  let sut: DeclarerJalonUseCase;

  const commande = {
    sessionId: 'session-uuid',
    participantId: 'participant-uuid',
    sondageId: SONDAGE_DE_TEST,
    etat: 'ca-va' as const,
  };

  const declarer = () => sut.execute(commande);

  installerSecretDeJalons();

  beforeEach(() => {
    depots = monterParticipationSurLeDernierEcran(COURS);
    pulses = createMockPulsesRepo();
    sut = new DeclarerJalonUseCase(depots.participation, pulses);
  });

  it('enregistre le jalon sous la cle HMAC du participant', async () => {
    await declarer();

    expect(pulses.declarer).toHaveBeenCalledWith({
      sessionId: 'session-uuid',
      cleParticipant: cleDeJalon('session-uuid', 'participant-uuid'),
      sondageId: SONDAGE_DE_TEST,
      etat: 'ca-va',
    });
  });

  it('ne laisse jamais fuiter l identifiant du participant dans la cle', async () => {
    await declarer();

    const [envoi] = pulses.declarer.mock.calls[0];
    expect(envoi.cleParticipant).toHaveLength(64);
    expect(envoi.cleParticipant).not.toContain('participant-uuid');
  });

  it('separe les cles de deux seances pour le meme participant', () => {
    expect(cleDeJalon('seance-a', 'participant-uuid')).not.toBe(
      cleDeJalon('seance-b', 'participant-uuid'),
    );
  });

  it('refuse un sondage absent du cours', async () => {
    await expect(
      sut.execute({ ...commande, sondageId: 'jalon-invente' }),
    ).rejects.toThrow(DomainValidationError);
    expect(pulses.declarer).not.toHaveBeenCalled();
  });

  verifierContratDeParticipation(() => ({
    ...depots,
    executer: declarer,
    effetsInterdits: () => [pulses.declarer],
  }));

  it('signale un cours introuvable', async () => {
    sut = new DeclarerJalonUseCase(
      creerParticipationEnSeance({
        ...depots,
        catalogue: creerCatalogueAVersions({}),
      }),
      pulses,
    );

    await expect(declarer()).rejects.toThrow(CoursInconnuError);
  });

  it('refuse de signer sans secret de jalon configure', () => {
    const secret = process.env.FORMATIONS_PULSE_SECRET;
    process.env.FORMATIONS_PULSE_SECRET = 'trop-court';

    expect(() => cleDeJalon('session-uuid', 'participant-uuid')).toThrow(
      /FORMATIONS_PULSE_SECRET/,
    );

    process.env.FORMATIONS_PULSE_SECRET = secret;
  });
});
