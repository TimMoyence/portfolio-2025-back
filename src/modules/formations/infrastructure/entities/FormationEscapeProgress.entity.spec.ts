import { getMetadataArgsStorage } from 'typeorm';
import { TENTATIVES_MAX_PAR_ENIGME } from '../../domain/cours/Enigmes';
import { FormationEscapeProgressEntity } from './FormationEscapeProgress.entity';

describe('FormationEscapeProgressEntity', () => {
  it('borne les tentatives d une énigme par le plafond commun', () => {
    const contrainte = getMetadataArgsStorage().checks.find(
      ({ target, name }) =>
        target === FormationEscapeProgressEntity &&
        name === 'CHK_formation_escape_progress_tentatives',
    );

    expect(contrainte?.expression).toBe(
      `"tentatives" BETWEEN 0 AND ${TENTATIVES_MAX_PAR_ENIGME}`,
    );
  });
});
