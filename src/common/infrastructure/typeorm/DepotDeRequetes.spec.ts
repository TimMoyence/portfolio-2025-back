import { SELF_DECLARED_DEPS_METADATA } from '@nestjs/common/constants';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { DeepPartial, Repository } from 'typeorm';
import { ColonnesDeRequete } from './ColonnesDeProvenance';
import { DepotDeRequetes } from './DepotDeRequetes';

class RequeteTemoin extends ColonnesDeRequete {
  sujet: string;
}

class DepotTemoin extends DepotDeRequetes(RequeteTemoin) {
  consignerSujet(sujet: string, ip?: string): Promise<RequeteTemoin> {
    return this.consigner({ sujet }, { ip });
  }
}

const depotEnMemoire = () => {
  const create = jest.fn((valeurs: DeepPartial<RequeteTemoin>) => ({
    ...valeurs,
    id: 'ligne-1',
  }));
  const save = jest.fn().mockResolvedValue(undefined);
  const repo = { create, save } as unknown as Repository<RequeteTemoin>;
  return { depot: new DepotTemoin(repo), create, save };
};

describe('DepotDeRequetes', () => {
  it('injecte le depot TypeORM de l entite consignee', () => {
    expect(
      Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, DepotTemoin),
    ).toEqual([{ index: 0, param: getRepositoryToken(RequeteTemoin) }]);
  });

  it('consigne les valeurs avec leur provenance et un identifiant de requete', async () => {
    const { depot, create } = depotEnMemoire();

    await depot.consignerSujet('audit', '203.0.113.7');

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        sujet: 'audit',
        ip: '203.0.113.7',
        requestId: expect.any(String) as string,
      }),
    );
  });

  it('enregistre puis rend la ligne creee', async () => {
    const { depot, save } = depotEnMemoire();

    const ligne = await depot.consignerSujet('cookies');

    expect(save).toHaveBeenCalledWith(ligne);
    expect(ligne.id).toBe('ligne-1');
  });
});
