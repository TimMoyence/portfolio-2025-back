import type { DataSource } from 'typeorm';
import { ColonnesDeRequete } from './ColonnesDeProvenance';
import { ColonnesDeTrace } from './ColonnesDeTrace';
import { EffacementDesProvenancesService } from './EffacementDesProvenances.service';

class DemandeTemoin extends ColonnesDeRequete {}
class TraceTemoin extends ColonnesDeTrace {}

describe('EffacementDesProvenancesService', () => {
  it('n efface que dans les tables dont l entité porte les colonnes de provenance', async () => {
    const execute = jest.fn().mockResolvedValue({ affected: 2 });
    const update = jest.fn().mockReturnValue({
      set: () => ({ where: () => ({ execute }) }),
    });
    const dataSource = {
      entityMetadatas: [
        {
          target: DemandeTemoin,
          inheritanceTree: [DemandeTemoin, ColonnesDeRequete, ColonnesDeTrace],
        },
        {
          target: TraceTemoin,
          inheritanceTree: [TraceTemoin, ColonnesDeTrace],
        },
      ],
      createQueryBuilder: () => ({ update }),
    } as unknown as DataSource;

    const effacees = await new EffacementDesProvenancesService(
      dataSource,
    ).effacer();

    expect(update.mock.calls).toEqual([[DemandeTemoin]]);
    expect(effacees).toBe(2);
  });
});
