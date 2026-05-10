/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { InsufficientPermissionsError } from '../../../../common/domain/errors/InsufficientPermissionsError';
import { ResourceNotFoundError } from '../../../../common/domain/errors/ResourceNotFoundError';
import {
  buildBudgetGroup,
  buildBudgetInvitation,
  createMockBudgetGroupRepo,
  createMockBudgetInvitationRepo,
} from '../../../../../test/factories/budget.factory';
import {
  BUDGET_GROUP_REPOSITORY,
  BUDGET_INVITATION_REPOSITORY,
} from '../../domain/token';
import { ListPendingInvitationsUseCase } from './ListPendingInvitations.useCase';

describe('ListPendingInvitationsUseCase', () => {
  let useCase: ListPendingInvitationsUseCase;
  let invitationRepo: ReturnType<typeof createMockBudgetInvitationRepo>;
  let groupRepo: ReturnType<typeof createMockBudgetGroupRepo>;

  beforeEach(async () => {
    invitationRepo = createMockBudgetInvitationRepo();
    groupRepo = createMockBudgetGroupRepo();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ListPendingInvitationsUseCase,
        { provide: BUDGET_INVITATION_REPOSITORY, useValue: invitationRepo },
        { provide: BUDGET_GROUP_REPOSITORY, useValue: groupRepo },
      ],
    }).compile();

    useCase = moduleRef.get(ListPendingInvitationsUseCase);
  });

  it('retourne la liste des invitations pending pour le owner mappees en PendingInvitationView', async () => {
    groupRepo.findById.mockResolvedValue(
      buildBudgetGroup({ id: 'g1', ownerId: 'u1' }),
    );
    const expiresAt = new Date('2026-05-17T00:00:00Z');
    const createdAt = new Date('2026-05-10T00:00:00Z');
    invitationRepo.findPendingByGroup.mockResolvedValue([
      buildBudgetInvitation({
        id: 'inv-1',
        targetEmail: 'a@example.com',
        expiresAt,
        createdAt,
        tokenHash: 'a'.repeat(64),
      }),
      buildBudgetInvitation({
        id: 'inv-2',
        targetEmail: 'b@example.com',
        expiresAt,
        createdAt,
        tokenHash: 'b'.repeat(64),
      }),
    ]);

    const result = await useCase.execute({ groupId: 'g1', userId: 'u1' });

    expect(result).toEqual([
      { id: 'inv-1', targetEmail: 'a@example.com', expiresAt, createdAt },
      { id: 'inv-2', targetEmail: 'b@example.com', expiresAt, createdAt },
    ]);
  });

  it('appelle findPendingByGroup avec la date courante (now)', async () => {
    groupRepo.findById.mockResolvedValue(
      buildBudgetGroup({ id: 'g1', ownerId: 'u1' }),
    );
    invitationRepo.findPendingByGroup.mockResolvedValue([]);
    const fixedNow = new Date('2026-05-10T12:34:56Z');
    jest.spyOn(Date, 'now').mockReturnValue(fixedNow.getTime());

    await useCase.execute({ groupId: 'g1', userId: 'u1' });

    expect(invitationRepo.findPendingByGroup).toHaveBeenCalledTimes(1);
    const [calledGroupId, calledNow] =
      invitationRepo.findPendingByGroup.mock.calls[0];
    expect(calledGroupId).toBe('g1');
    expect(calledNow).toBeInstanceOf(Date);
    expect(calledNow.getTime()).toBe(fixedNow.getTime());
  });

  it('retourne un tableau vide quand aucune invitation pending', async () => {
    groupRepo.findById.mockResolvedValue(
      buildBudgetGroup({ id: 'g1', ownerId: 'u1' }),
    );
    invitationRepo.findPendingByGroup.mockResolvedValue([]);

    const result = await useCase.execute({ groupId: 'g1', userId: 'u1' });

    expect(result).toEqual([]);
  });

  it('throw ResourceNotFoundError si le groupe est inconnu', async () => {
    groupRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ groupId: 'nope', userId: 'u1' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
    expect(invitationRepo.findPendingByGroup).not.toHaveBeenCalled();
  });

  it('throw InsufficientPermissionsError si le demandeur n est pas owner', async () => {
    groupRepo.findById.mockResolvedValue(
      buildBudgetGroup({ id: 'g1', ownerId: 'u1' }),
    );

    await expect(
      useCase.execute({ groupId: 'g1', userId: 'autre' }),
    ).rejects.toBeInstanceOf(InsufficientPermissionsError);
    expect(invitationRepo.findPendingByGroup).not.toHaveBeenCalled();
  });
});
