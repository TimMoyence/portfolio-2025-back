import {
  buildFormationGroupEntity,
  mockTypeOrmRepository,
} from '../../../../test/factories/formation-entities.factory';
import { mockTypeOrmCreate } from '../../../../test/factories/formation.factory';
import {
  FormationGroupNameTakenError,
  FormationGroupNotFoundError,
  ParticipantNotFoundError,
} from '../domain/errors/FormationErrors';
import type { FormationGroupEntity } from './entities/FormationGroup.entity';
import type { FormationParticipantEntity } from './entities/FormationParticipant.entity';
import { FormationGroupsRepositoryTypeORM } from './FormationGroups.repository.typeorm';

const SESSION_ID = 'session-uuid';
const NOM_DEJA_PRIS = {
  code: '23505',
  constraint: 'UQ_formation_groups_session_name',
};

describe('FormationGroupsRepositoryTypeORM', () => {
  const groupe = buildFormationGroupEntity();
  const save = jest.fn();
  const update = jest.fn();
  const findOne = jest.fn();
  const find = jest.fn();
  const affecter = jest.fn();
  const sut = new FormationGroupsRepositoryTypeORM(
    mockTypeOrmRepository<FormationGroupEntity>({
      create: mockTypeOrmCreate(),
      save,
      update,
      findOne,
      find,
    }),
    mockTypeOrmRepository<FormationParticipantEntity>({ update: affecter }),
  );

  beforeEach(() => {
    save.mockReset().mockResolvedValue(groupe);
    update.mockReset().mockResolvedValue({ affected: 1 });
    findOne.mockReset().mockResolvedValue(groupe);
    find.mockReset().mockResolvedValue([groupe]);
    affecter.mockReset().mockResolvedValue({ affected: 1 });
  });

  it('cree un groupe dans la seance', async () => {
    await expect(sut.create(SESSION_ID, 'Groupe A')).resolves.toMatchObject({
      id: 'group-uuid',
    });
    expect(save).toHaveBeenCalledWith({
      sessionId: SESSION_ID,
      name: 'Groupe A',
    });
  });

  it('renomme le groupe de la seance et relit la ligne', async () => {
    await expect(
      sut.rename(SESSION_ID, 'group-uuid', 'Groupe B'),
    ).resolves.toMatchObject({ id: 'group-uuid' });
    expect(update).toHaveBeenCalledWith(
      { id: 'group-uuid', sessionId: SESSION_ID },
      { name: 'Groupe B' },
    );
  });

  it('liste les groupes par nom puis par identifiant', async () => {
    await expect(sut.listBySession(SESSION_ID)).resolves.toHaveLength(1);
    expect(find).toHaveBeenCalledWith({
      where: { sessionId: SESSION_ID },
      order: { name: 'ASC', id: 'ASC' },
    });
  });

  it('affecte un participant a un groupe de la seance puis le retire', async () => {
    await sut.assignParticipant(SESSION_ID, 'participant-uuid', 'group-uuid');
    await sut.assignParticipant(SESSION_ID, 'participant-uuid', null);

    expect(affecter.mock.calls).toEqual([
      [
        { id: 'participant-uuid', sessionId: SESSION_ID },
        { groupId: 'group-uuid' },
      ],
      [{ id: 'participant-uuid', sessionId: SESSION_ID }, { groupId: null }],
    ]);
    expect(findOne).toHaveBeenCalledTimes(1);
  });

  it('refuse un groupe qui n appartient pas a la seance', async () => {
    findOne.mockResolvedValue(null);

    await expect(
      sut.rename(SESSION_ID, 'inconnu', 'Groupe B'),
    ).rejects.toBeInstanceOf(FormationGroupNotFoundError);
    await expect(
      sut.assignParticipant(SESSION_ID, 'participant-uuid', 'inconnu'),
    ).rejects.toBeInstanceOf(FormationGroupNotFoundError);
    expect(affecter).not.toHaveBeenCalled();
  });

  it('refuse un participant qui n appartient pas a la seance', async () => {
    affecter.mockResolvedValue({ affected: 0 });

    await expect(
      sut.assignParticipant(SESSION_ID, 'inconnu', 'group-uuid'),
    ).rejects.toBeInstanceOf(ParticipantNotFoundError);
  });

  it('classe le nom de groupe deja pris dans la seance et laisse passer les autres pannes', async () => {
    const panne = new Error('connexion perdue');
    save.mockRejectedValueOnce(NOM_DEJA_PRIS).mockRejectedValueOnce(panne);
    update.mockRejectedValueOnce(NOM_DEJA_PRIS);

    await expect(sut.create(SESSION_ID, 'A')).rejects.toBeInstanceOf(
      FormationGroupNameTakenError,
    );
    await expect(sut.create(SESSION_ID, 'A')).rejects.toBe(panne);
    await expect(
      sut.rename(SESSION_ID, 'group-uuid', 'A'),
    ).rejects.toBeInstanceOf(FormationGroupNameTakenError);
  });
});
