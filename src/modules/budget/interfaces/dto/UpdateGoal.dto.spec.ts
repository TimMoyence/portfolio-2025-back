import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateGoalDto } from './UpdateGoal.dto';

describe('UpdateGoalDto', () => {
  it('accepte un patch vide (aucun champ requis)', async () => {
    const dto = plainToInstance(UpdateGoalDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepte un patch name valide', async () => {
    const dto = plainToInstance(UpdateGoalDto, { name: 'Nouvelle voiture' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepte un patch kind valide', async () => {
    const dto = plainToInstance(UpdateGoalDto, { kind: 'SPENDING_LIMIT' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejette kind inconnu', async () => {
    const dto = plainToInstance(UpdateGoalDto, { kind: 'BAD_KIND' });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('accepte un patch targetAmount valide', async () => {
    const dto = plainToInstance(UpdateGoalDto, { targetAmount: 1500 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
