import {
  buildIncidentEntity,
  mockTypeOrmRepository,
} from '../../../../test/factories/formation-entities.factory';
import {
  buildIncidentInput,
  mockTypeOrmCreate,
} from '../../../../test/factories/formation.factory';
import type { FormationIncidentEntity } from './entities/FormationIncident.entity';
import { IncidentsRepositoryTypeORM } from './Incidents.repository.typeorm';

describe('IncidentsRepositoryTypeORM', () => {
  const save = jest.fn();
  const find = jest.fn();
  const sut = new IncidentsRepositoryTypeORM(
    mockTypeOrmRepository<FormationIncidentEntity>({
      create: mockTypeOrmCreate(),
      save,
      find,
    }),
  );

  beforeEach(() => {
    save.mockReset().mockResolvedValue(undefined);
    find.mockReset().mockResolvedValue([buildIncidentEntity()]);
  });

  it('n ecrit rien pour un lot d incidents vide', async () => {
    await sut.createMany([]);

    expect(save).not.toHaveBeenCalled();
  });

  it('enregistre un lot d incidents en une seule ecriture', async () => {
    const incident = buildIncidentInput();

    await sut.createMany([incident, incident]);

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith([incident, incident]);
  });

  it('relit les incidents de la seance', async () => {
    await expect(sut.listBySession('session-uuid')).resolves.toEqual([
      expect.objectContaining({ id: 'incident-uuid', type: 'tab_hidden' }),
    ]);
    expect(find).toHaveBeenCalledWith({ where: { sessionId: 'session-uuid' } });
  });
});
