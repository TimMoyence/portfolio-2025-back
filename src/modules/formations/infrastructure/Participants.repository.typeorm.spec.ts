import { IsNull, Not } from 'typeorm';
import { ResourceConflictError } from '../../../common/domain/errors/ResourceConflictError';
import {
  GraineRepriseError,
  ParticipantEvinceError,
  PlaceDejaPriseError,
  SeanceCompleteError,
  SeedAlreadyAssignedError,
  SeedPoolExhaustedError,
} from '../domain/errors/FormationErrors';
import {
  buildParticipantEntity,
  mockTypeOrmManager,
  mockTypeOrmRepositoryAvecManager,
} from '../../../../test/factories/formation-entities.factory';
import {
  mockTypeOrmCreate,
  mockTypeOrmSave,
} from '../../../../test/factories/formation.factory';
import type { FormationParticipantEntity } from './entities/FormationParticipant.entity';
import { ParticipantsRepositoryTypeORM } from './Participants.repository.typeorm';

describe('ParticipantsRepositoryTypeORM', () => {
  const save = jest.fn();
  const update = jest.fn();
  const count = jest.fn();
  const findOne = jest.fn();
  const find = jest.fn();
  const query = jest.fn();
  const managerCount = jest.fn();
  const managerFindOne = jest.fn();
  const managerFind = jest.fn();
  const managerUpdate = jest.fn();
  const manager = mockTypeOrmManager({
    query,
    count: managerCount,
    findOne: managerFindOne,
    find: managerFind,
    update: managerUpdate,
    create: mockTypeOrmCreate(),
    save,
  });
  const sut = new ParticipantsRepositoryTypeORM(
    mockTypeOrmRepositoryAvecManager<FormationParticipantEntity>(
      { update, count, findOne, find },
      manager,
    ),
  );

  const input = {
    sessionId: 'session-uuid',
    studentKey: 'student-uuid',
    prenom: 'Theo',
    nom: 'Martin',
    email: 'theo.martin@example.com',
    capacite: 35,
    empreinteDeReprise: 'empreinte-neuve',
    repriseAutorisee: () => true,
    choisirGraine: (prises: readonly number[]) =>
      prises.includes(1001) ? 1002 : 1001,
  };

  beforeEach(() => {
    save.mockReset().mockImplementation(
      mockTypeOrmSave({
        id: 'participant-uuid',
        rejointLe: new Date('2026-09-11T08:05:00.000Z'),
        dernierPing: new Date('2026-09-11T08:05:00.000Z'),
      }),
    );
    update.mockReset().mockResolvedValue({ affected: 1 });
    count.mockReset().mockResolvedValue(3);
    findOne.mockReset().mockResolvedValue(buildParticipantEntity());
    find.mockReset().mockResolvedValue([buildParticipantEntity()]);
    query.mockReset().mockResolvedValue([]);
    managerCount.mockReset().mockResolvedValue(0);
    managerFindOne.mockReset().mockResolvedValue(null);
    managerFind.mockReset().mockResolvedValue([]);
    managerUpdate.mockReset().mockResolvedValue({ affected: 1 });
  });

  it('inscrit un participant sur une graine libre, apres avoir verrouille la seance', async () => {
    const { participant, nouveau } = await sut.inscrire(input);

    expect(nouveau).toBe(true);
    expect(participant.id).toBe('participant-uuid');
    expect(participant.seed).toBe(1001);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('FOR UPDATE'), [
      'session-uuid',
    ]);
    expect(manager.transaction.mock.invocationCallOrder[0]).toBeLessThan(
      query.mock.invocationCallOrder[0],
    );
  });

  it('verrouille la seance avant de compter ses places', async () => {
    await sut.inscrire(input);

    expect(query.mock.invocationCallOrder[0]).toBeLessThan(
      managerCount.mock.invocationCallOrder[0],
    );
  });

  it('rend sa place au participant deja inscrit au lieu d un conflit', async () => {
    managerFindOne.mockResolvedValue(buildParticipantEntity({ seed: 1002 }));

    const { participant, nouveau } = await sut.inscrire(input);

    expect(nouveau).toBe(false);
    expect(participant.seed).toBe(1002);
    expect(save).not.toHaveBeenCalled();
  });

  it('S1 · enregistre l empreinte du secret de reprise du nouveau participant', async () => {
    await sut.inscrire(input);

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ empreinteDeReprise: 'empreinte-neuve' }),
    );
  });

  it('S1 · refuse en PLACE_DEJA_PRISE la place d un inscrit au poste sans son secret', async () => {
    managerFindOne.mockResolvedValue(
      buildParticipantEntity({ empreinteDeReprise: 'empreinte-du-poste' }),
    );

    await expect(
      sut.inscrire({ ...input, repriseAutorisee: () => false }),
    ).rejects.toThrow(PlaceDejaPriseError);
    expect(managerUpdate).not.toHaveBeenCalled();
  });

  it('S1 · confronte le secret presente a l empreinte stockee, puis la renouvelle', async () => {
    managerFindOne.mockResolvedValue(
      buildParticipantEntity({ empreinteDeReprise: 'empreinte-du-poste' }),
    );
    const repriseAutorisee = jest.fn().mockReturnValue(true);

    await sut.inscrire({ ...input, repriseAutorisee });

    expect(repriseAutorisee).toHaveBeenCalledWith('empreinte-du-poste');
    expect(managerUpdate).toHaveBeenCalledWith(
      expect.anything(),
      { id: 'participant-uuid', evinceLe: IsNull() },
      { empreinteDeReprise: 'empreinte-neuve' },
    );
  });

  it('S2 · refuse en PARTICIPANT_EVINCE la reprise d une place evincee pendant qu elle se reprenait', async () => {
    managerFindOne.mockResolvedValue(
      buildParticipantEntity({ empreinteDeReprise: 'empreinte-du-poste' }),
    );
    managerUpdate.mockResolvedValue({ affected: 0 });

    await expect(sut.inscrire(input)).rejects.toThrow(ParticipantEvinceError);
  });

  it('S2 · refuse en PARTICIPANT_EVINCE le retour de l evince sous la meme cle', async () => {
    managerFindOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(
        buildParticipantEntity({ evinceLe: new Date('2026-09-24T08:00:00Z') }),
      );

    await expect(sut.inscrire(input)).rejects.toThrow(ParticipantEvinceError);
    expect(managerFindOne).toHaveBeenLastCalledWith(expect.anything(), {
      where: {
        sessionId: 'session-uuid',
        studentKey: 'student-uuid',
        evinceLe: Not(IsNull()),
      },
    });
    expect(save).not.toHaveBeenCalled();
  });

  it('refuse une inscription au-dela de la capacite, dans la transaction', async () => {
    managerCount.mockResolvedValue(35);

    await expect(sut.inscrire(input)).rejects.toThrow(SeanceCompleteError);
    expect(save).not.toHaveBeenCalled();
  });

  it('choisit une graine hors de celles deja prises dans la seance', async () => {
    managerFind.mockResolvedValue([buildParticipantEntity({ seed: 1001 })]);

    const { participant } = await sut.inscrire(input);

    expect(participant.seed).toBe(1002);
  });

  it('refuse quand tous les tirages de la seance sont attribues', async () => {
    await expect(
      sut.inscrire({ ...input, choisirGraine: () => null }),
    ).rejects.toThrow(SeedPoolExhaustedError);
    expect(save).not.toHaveBeenCalled();
  });

  it('traduit la violation de uq_formation_participants_session_key en conflit de session deja rejointe', async () => {
    save.mockRejectedValue({
      code: '23505',
      constraint: 'uq_formation_participants_session_key',
    });
    await expect(sut.inscrire(input)).rejects.toThrow(ResourceConflictError);
    await expect(sut.inscrire(input)).rejects.toThrow(
      'Ce participant a deja rejoint cette session',
    );
  });

  it('traduit la violation de uq_formation_participants_session_seed en tirage deja attribue, distinct du conflit de session', async () => {
    save.mockRejectedValue({
      code: '23505',
      constraint: 'uq_formation_participants_session_seed',
    });
    await expect(sut.inscrire(input)).rejects.toBeInstanceOf(
      SeedAlreadyAssignedError,
    );
    await expect(sut.inscrire(input)).rejects.toThrow(
      'Le tirage 1001 est deja attribue dans cette session',
    );
  });

  it('ne masque pas une contrainte unique non reconnue derriere le message de session deja rejointe', async () => {
    save.mockRejectedValue({
      code: '23505',
      constraint: 'UQ_autre_contrainte_inconnue',
    });
    await expect(sut.inscrire(input)).rejects.toThrow(
      'Conflit lors de la creation du participant',
    );
  });

  it('laisse passer une erreur qui ne vient pas d une violation de contrainte unique', async () => {
    save.mockRejectedValue(new Error('connexion perdue'));
    await expect(sut.inscrire(input)).rejects.toThrow('connexion perdue');
  });

  it('retrouve un participant par seance et cle etudiante, ou par identifiant', async () => {
    await expect(
      sut.findBySessionAndStudentKey('session-uuid', 'student-uuid'),
    ).resolves.toMatchObject({ id: 'participant-uuid' });
    await expect(sut.findById('participant-uuid')).resolves.toMatchObject({
      id: 'participant-uuid',
    });
    expect(findOne.mock.calls).toEqual([
      [
        {
          where: {
            sessionId: 'session-uuid',
            studentKey: 'student-uuid',
            evinceLe: IsNull(),
          },
        },
      ],
      [{ where: { id: 'participant-uuid' } }],
    ]);
  });

  it('rend null pour un participant absent', async () => {
    findOne.mockResolvedValue(null);
    await expect(sut.findById('inconnu')).resolves.toBeNull();
  });

  it('liste les participants dans l ordre d arrivee', async () => {
    await expect(sut.listBySession('session-uuid')).resolves.toHaveLength(1);
    expect(find).toHaveBeenCalledWith({
      where: { sessionId: 'session-uuid', evinceLe: IsNull() },
      order: { rejointLe: 'ASC', id: 'ASC' },
    });
  });

  it('compte les participants d une seance sans les charger', async () => {
    await expect(sut.countBySession('session-uuid')).resolves.toBe(3);
    expect(count).toHaveBeenCalledWith({
      where: { sessionId: 'session-uuid', evinceLe: IsNull() },
    });
  });

  it('met a jour le dernier ping', async () => {
    await sut.touch('participant-uuid');
    expect(update).toHaveBeenCalledWith(
      'participant-uuid',
      expect.objectContaining({ dernierPing: expect.any(Date) }),
    );
  });

  describe('S2 · readmission', () => {
    it('verrouille la seance, puis compte ses places avant de readmettre', async () => {
      managerUpdate.mockResolvedValue({ affected: 1 });

      await expect(
        sut.readmettre('session-uuid', 'participant-uuid', 35),
      ).resolves.toBe(true);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('FOR UPDATE'),
        ['session-uuid'],
      );
      expect(query.mock.invocationCallOrder[0]).toBeLessThan(
        managerCount.mock.invocationCallOrder[0],
      );
      expect(managerCount.mock.invocationCallOrder[0]).toBeLessThan(
        managerUpdate.mock.invocationCallOrder[0],
      );
      expect(managerUpdate).toHaveBeenCalledWith(
        expect.anything(),
        {
          id: 'participant-uuid',
          sessionId: 'session-uuid',
          evinceLe: Not(IsNull()),
        },
        { evinceLe: null },
      );
    });

    it('refuse sous verrou la readmission au-dela de la capacite', async () => {
      managerCount.mockResolvedValue(35);

      await expect(
        sut.readmettre('session-uuid', 'participant-uuid', 35),
      ).rejects.toThrow(SeanceCompleteError);
      expect(managerUpdate).not.toHaveBeenCalled();
    });

    it('traduit la graine reprise par un autre poste en GRAINE_REPRISE, jamais en erreur serveur', async () => {
      managerUpdate.mockRejectedValue({
        code: '23505',
        constraint: 'uq_formation_participants_session_seed',
      });

      await expect(
        sut.readmettre('session-uuid', 'participant-uuid', 35),
      ).rejects.toBeInstanceOf(GraineRepriseError);
    });

    it('traduit une cle deja active en conflit, jamais en erreur serveur', async () => {
      managerUpdate.mockRejectedValue({
        code: '23505',
        constraint: 'uq_formation_participants_session_key',
      });

      await expect(
        sut.readmettre('session-uuid', 'participant-uuid', 35),
      ).rejects.toBeInstanceOf(ResourceConflictError);
    });
  });

  it('S1 · libere le poste d un participant actif en oubliant son empreinte de reprise', async () => {
    await expect(
      sut.libererPoste('session-uuid', 'participant-uuid'),
    ).resolves.toBe(true);

    expect(managerUpdate).toHaveBeenCalledWith(
      expect.anything(),
      { id: 'participant-uuid', sessionId: 'session-uuid', evinceLe: IsNull() },
      expect.objectContaining({ empreinteDeReprise: null }),
    );
  });

  it('S1 · verrouille la seance avant de liberer le poste, comme une reprise', async () => {
    await sut.libererPoste('session-uuid', 'participant-uuid');

    expect(query).toHaveBeenCalledWith(expect.stringContaining('FOR UPDATE'), [
      'session-uuid',
    ]);
    expect(query.mock.invocationCallOrder[0]).toBeLessThan(
      managerUpdate.mock.invocationCallOrder[0],
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('S1 · rend faux quand aucun poste actif ne correspond', async () => {
    managerUpdate.mockResolvedValue({ affected: 0 });

    await expect(
      sut.libererPoste('session-uuid', 'participant-uuid'),
    ).resolves.toBe(false);
  });

  it('S1 · revoque a la liberation les jetons deja emis en avancant la generation', async () => {
    await sut.libererPoste('session-uuid', 'participant-uuid');

    const [, , valeurs] = managerUpdate.mock.calls[0] as [
      unknown,
      unknown,
      { generationDeJeton: () => string },
    ];
    expect(valeurs.generationDeJeton()).toBe('"generation_de_jeton" + 1');
  });

  it('S1 · rend la generation de jeton de la place reprise', async () => {
    managerFindOne.mockResolvedValue(
      buildParticipantEntity({ generationDeJeton: 3 }),
    );

    const { participant } = await sut.inscrire(input);

    expect(participant.generationDeJeton).toBe(3);
  });
});
