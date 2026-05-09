import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpsertContributionDto } from './UpsertContribution.dto';

describe('UpsertContributionDto', () => {
  it('accepte un payload valide', async () => {
    const dto = plainToInstance(UpsertContributionDto, {
      groupId: '550e8400-e29b-41d4-a716-446655440000',
      month: 5,
      year: 2026,
      monthlySalary: 2500,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejette monthlySalary < 0', async () => {
    const dto = plainToInstance(UpsertContributionDto, {
      groupId: '550e8400-e29b-41d4-a716-446655440000',
      month: 5,
      year: 2026,
      monthlySalary: -1,
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('rejette month hors 1..12', async () => {
    const dto = plainToInstance(UpsertContributionDto, {
      groupId: '550e8400-e29b-41d4-a716-446655440000',
      month: 13,
      year: 2026,
      monthlySalary: 100,
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('rejette year hors 2000..2100', async () => {
    const dto = plainToInstance(UpsertContributionDto, {
      groupId: '550e8400-e29b-41d4-a716-446655440000',
      month: 5,
      year: 1999,
      monthlySalary: 100,
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('rejette groupId non UUID', async () => {
    const dto = plainToInstance(UpsertContributionDto, {
      groupId: 'not-a-uuid',
      month: 5,
      year: 2026,
      monthlySalary: 100,
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });

  it('rejette monthlySalary Infinity', async () => {
    const dto = plainToInstance(UpsertContributionDto, {
      groupId: '550e8400-e29b-41d4-a716-446655440000',
      month: 5,
      year: 2026,
      monthlySalary: Number.POSITIVE_INFINITY,
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });
});
