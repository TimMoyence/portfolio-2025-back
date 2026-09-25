import { BadRequestException } from '@nestjs/common';
import { validateBody } from '../../../../../test/helpers/validation-pipe';
import { DureeDeReponse } from './duree-de-reponse.decorator';

const CINQ_HEURES_MS = 5 * 60 * 60 * 1000;

class ReponseTemoin {
  @DureeDeReponse(42000)
  dureeMs: number;
}

describe('DureeDeReponse', () => {
  it.each([0, 42000, CINQ_HEURES_MS])(
    'accepte une duree entiere de %i ms',
    async (dureeMs) => {
      await expect(
        validateBody({ dureeMs }, ReponseTemoin),
      ).resolves.toMatchObject({ dureeMs });
    },
  );

  it.each([-1, 1.5, CINQ_HEURES_MS + 1])(
    'refuse une duree de %d ms',
    async (dureeMs) => {
      await expect(
        validateBody({ dureeMs }, ReponseTemoin),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );
});
