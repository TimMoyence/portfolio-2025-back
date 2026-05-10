import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateGoalDto } from './CreateGoal.dto';

describe('CreateGoalDto', () => {
  const validBase = {
    groupId: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Vacances ete',
    kind: 'SAVINGS',
    targetAmount: 1000,
  };

  it('accepte un payload SAVINGS minimal valide', async () => {
    const dto = plainToInstance(CreateGoalDto, validBase);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepte un payload CATEGORY_LIMIT avec categoryId valide', async () => {
    const dto = plainToInstance(CreateGoalDto, {
      ...validBase,
      kind: 'CATEGORY_LIMIT',
      categoryId: '550e8400-e29b-41d4-a716-446655440001',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejette name vide', async () => {
    const dto = plainToInstance(CreateGoalDto, { ...validBase, name: '' });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('rejette name > 120 chars', async () => {
    const dto = plainToInstance(CreateGoalDto, {
      ...validBase,
      name: 'a'.repeat(121),
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('rejette kind inconnu', async () => {
    const dto = plainToInstance(CreateGoalDto, {
      ...validBase,
      kind: 'UNKNOWN_KIND',
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('rejette targetAmount < 0', async () => {
    const dto = plainToInstance(CreateGoalDto, {
      ...validBase,
      targetAmount: -1,
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('rejette targetAmount Infinity', async () => {
    const dto = plainToInstance(CreateGoalDto, {
      ...validBase,
      targetAmount: Number.POSITIVE_INFINITY,
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('rejette groupId non UUID', async () => {
    const dto = plainToInstance(CreateGoalDto, {
      ...validBase,
      groupId: 'not-a-uuid',
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('accepte deadline ISO valide', async () => {
    const dto = plainToInstance(CreateGoalDto, {
      ...validBase,
      deadline: '2026-12-31',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
