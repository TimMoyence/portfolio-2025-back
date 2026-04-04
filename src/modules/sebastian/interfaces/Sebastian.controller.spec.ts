/* eslint-disable @typescript-eslint/unbound-method */
import type { Request } from 'express';
import { SebastianController } from './Sebastian.controller';
import type { AddEntryUseCase } from '../application/services/AddEntry.useCase';
import type { ListEntriesUseCase } from '../application/services/ListEntries.useCase';
import type { DeleteEntryUseCase } from '../application/services/DeleteEntry.useCase';
import type { GetStatsUseCase } from '../application/services/GetStats.useCase';
import type { SetGoalUseCase } from '../application/services/SetGoal.useCase';
import type { ListGoalsUseCase } from '../application/services/ListGoals.useCase';
import type { DeleteGoalUseCase } from '../application/services/DeleteGoal.useCase';
import {
  buildSebastianEntry,
  buildSebastianGoal,
  buildStatsResult,
} from '../../../../test/factories/sebastian.factory';

describe('SebastianController', () => {
  let controller: SebastianController;
  let addEntryUseCase: jest.Mocked<AddEntryUseCase>;
  let listEntriesUseCase: jest.Mocked<ListEntriesUseCase>;
  let deleteEntryUseCase: jest.Mocked<DeleteEntryUseCase>;
  let getStatsUseCase: jest.Mocked<GetStatsUseCase>;
  let setGoalUseCase: jest.Mocked<SetGoalUseCase>;
  let listGoalsUseCase: jest.Mocked<ListGoalsUseCase>;
  let deleteGoalUseCase: jest.Mocked<DeleteGoalUseCase>;

  const mockReq = { user: { sub: 'user-1' } } as unknown as Request;

  beforeEach(() => {
    addEntryUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AddEntryUseCase>;
    listEntriesUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ListEntriesUseCase>;
    deleteEntryUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<DeleteEntryUseCase>;
    getStatsUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetStatsUseCase>;
    setGoalUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<SetGoalUseCase>;
    listGoalsUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ListGoalsUseCase>;
    deleteGoalUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<DeleteGoalUseCase>;

    controller = new SebastianController(
      addEntryUseCase,
      listEntriesUseCase,
      deleteEntryUseCase,
      getStatsUseCase,
      setGoalUseCase,
      listGoalsUseCase,
      deleteGoalUseCase,
    );
  });

  it('devrait deleguer createEntry au use case AddEntry', async () => {
    const entry = buildSebastianEntry();
    addEntryUseCase.execute.mockResolvedValue(entry);

    const result = await controller.createEntry(
      { category: 'coffee', quantity: 2, date: '2026-03-15', notes: 'test' },
      mockReq,
    );

    expect(addEntryUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      category: 'coffee',
      quantity: 2,
      date: '2026-03-15',
      notes: 'test',
    });
    expect(result.id).toBe(entry.id);
  });

  it('devrait deleguer listAllEntries au use case ListEntries', async () => {
    const entries = [buildSebastianEntry()];
    listEntriesUseCase.execute.mockResolvedValue(entries);

    const result = await controller.listAllEntries(
      { from: '2026-03-01', to: '2026-03-31' },
      mockReq,
    );

    expect(listEntriesUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      from: '2026-03-01',
      to: '2026-03-31',
      category: undefined,
    });
    expect(result).toHaveLength(1);
  });

  it('devrait deleguer removeEntry au use case DeleteEntry', async () => {
    deleteEntryUseCase.execute.mockResolvedValue(undefined);

    await controller.removeEntry('entry-1', mockReq);

    expect(deleteEntryUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      entryId: 'entry-1',
    });
  });

  it('devrait deleguer getStatistics au use case GetStats', async () => {
    const stats = buildStatsResult();
    getStatsUseCase.execute.mockResolvedValue(stats);

    const result = await controller.getStatistics({ period: 'week' }, mockReq);

    expect(getStatsUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      period: 'week',
    });
    expect(result.period).toBe('week');
    expect(result.byCategory).toHaveLength(2);
  });

  it('devrait deleguer createGoal au use case SetGoal', async () => {
    const goal = buildSebastianGoal();
    setGoalUseCase.execute.mockResolvedValue(goal);

    const result = await controller.createGoal(
      { category: 'coffee', targetQuantity: 3, period: 'daily' },
      mockReq,
    );

    expect(setGoalUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      category: 'coffee',
      targetQuantity: 3,
      period: 'daily',
    });
    expect(result.id).toBe(goal.id);
  });

  it('devrait deleguer listAllGoals au use case ListGoals', async () => {
    const goals = [buildSebastianGoal()];
    listGoalsUseCase.execute.mockResolvedValue(goals);

    const result = await controller.listAllGoals(mockReq);

    expect(listGoalsUseCase.execute).toHaveBeenCalledWith('user-1');
    expect(result).toHaveLength(1);
  });

  it('devrait deleguer removeGoal au use case DeleteGoal', async () => {
    deleteGoalUseCase.execute.mockResolvedValue(undefined);

    await controller.removeGoal('goal-1', mockReq);

    expect(deleteGoalUseCase.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      goalId: 'goal-1',
    });
  });
});
